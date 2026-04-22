package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"
)

type Server struct {
	configs   map[string]*rest.Config
	clients   map[string]*kubernetes.Clientset
	contexts  map[string]*api.Context
	wsClients map[*websocket.Conn]string
	mu        sync.RWMutex
}

type ClusterInfo struct {
	Name      string `json:"name"`
	Server    string `json:"server"`
	Current   bool   `json:"current"`
	Namespace string `json:"namespace"`
}

type DashboardData struct {
	Clusters     []ClusterInfo `json:"clusters"`
	Namespaces   int           `json:"namespaces"`
	Pods         int           `json:"pods"`
	Deployments  int           `json:"deployments"`
	Services     int           `json:"services"`
	RunningPods  int           `json:"runningPods"`
	FailedPods   int           `json:"failedPods"`
}

type PodInfo struct {
	Name       string            `json:"name"`
	Namespace  string            `json:"namespace"`
	Status     string            `json:"status"`
	Ready      string            `json:"ready"`
	Restarts   int32             `json:"restarts"`
	Age        string            `json:"age"`
	Node       string            `json:"node"`
	Labels     map[string]string `json:"labels"`
	Containers []ContainerInfo   `json:"containers"`
}

type ContainerInfo struct {
	Name  string `json:"name"`
	Image string `json:"image"`
	Ready bool   `json:"ready"`
}

type DeploymentInfo struct {
	Name         string            `json:"name"`
	Namespace    string            `json:"namespace"`
	Replicas     int32             `json:"replicas"`
	Ready        int32             `json:"ready"`
	Available    int32             `json:"available"`
	Age          string            `json:"age"`
	Labels       map[string]string `json:"labels"`
	Selector     map[string]string `json:"selector"`
	Strategy     string            `json:"strategy"`
	Images       []string          `json:"images"`
}

type WebSocketMessage struct {
	Type    string      `json:"type"`
	Cluster string      `json:"cluster"`
	Data    interface{} `json:"data"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow connections from any origin in development
	},
}

func main() {
	server := &Server{
		configs:   make(map[string]*rest.Config),
		clients:   make(map[string]*kubernetes.Clientset),
		contexts:  make(map[string]*api.Context),
		wsClients: make(map[*websocket.Conn]string),
	}

	// Load kubeconfig
	if err := server.loadKubeConfig(); err != nil {
		log.Fatal("Failed to load kubeconfig:", err)
	}

	// Setup Gin router
	r := gin.Default()
	
	// Enable CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// API Routes
	api := r.Group("/api/v1")
	{
		api.GET("/clusters", server.getClusters)
		api.GET("/dashboard/:cluster", server.getDashboard)
		api.GET("/namespaces/:cluster", server.getNamespaces)
		api.GET("/pods/:cluster/:namespace", server.getPods)
		api.GET("/deployments/:cluster/:namespace", server.getDeployments)
		api.DELETE("/pods/:cluster/:namespace/:pod", server.deletePod)
		api.PATCH("/deployments/:cluster/:namespace/:deployment/scale", server.scaleDeployment)
		api.DELETE("/deployments/:cluster/:namespace/:deployment", server.deleteDeployment)
		api.GET("/pods/:cluster/:namespace/:pod/logs", server.getPodLogs)
	}

	// WebSocket endpoint
	r.GET("/ws", server.handleWebSocket)

	// Start watchers for real-time updates
	go server.startWatchers()

	log.Println("AKS Connector backend starting on :8080")
	r.Run(":8080")
}

func (s *Server) loadKubeConfig() error {
	// Get kubeconfig path
	kubeconfigPath := filepath.Join(os.Getenv("HOME"), ".kube", "config")
	if home := os.Getenv("USERPROFILE"); home != "" {
		kubeconfigPath = filepath.Join(home, ".kube", "config")
	}
	if kubeconfig := os.Getenv("KUBECONFIG"); kubeconfig != "" {
		kubeconfigPath = kubeconfig
	}

	// Load kubeconfig
	config, err := clientcmd.LoadFromFile(kubeconfigPath)
	if err != nil {
		return fmt.Errorf("failed to load kubeconfig: %v", err)
	}

	// Create clients for each context
	for contextName, context := range config.Contexts {
		clientConfig := clientcmd.NewDefaultClientConfig(*config, &clientcmd.ConfigOverrides{
			CurrentContext: contextName,
		})

		restConfig, err := clientConfig.ClientConfig()
		if err != nil {
			log.Printf("Failed to create config for context %s: %v", contextName, err)
			continue
		}

		clientset, err := kubernetes.NewForConfig(restConfig)
		if err != nil {
			log.Printf("Failed to create clientset for context %s: %v", contextName, err)
			continue
		}

		s.configs[contextName] = restConfig
		s.clients[contextName] = clientset
		s.contexts[contextName] = context
		
		log.Printf("Loaded context: %s", contextName)
	}

	return nil
}

func (s *Server) getClusters(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	clusters := make([]ClusterInfo, 0)
	for name, context := range s.contexts {
		clusterInfo := ClusterInfo{
			Name:      name,
			Server:    "AKS Cluster", // Could extract from cluster info
			Current:   false,         // Could determine current context
			Namespace: context.Namespace,
		}
		clusters = append(clusters, clusterInfo)
	}

	c.JSON(200, clusters)
}

func (s *Server) getDashboard(c *gin.Context) {
	cluster := c.Param("cluster")
	client, exists := s.clients[cluster]
	if !exists {
		c.JSON(404, gin.H{"error": "Cluster not found"})
		return
	}

	ctx := context.Background()
	
	// Get namespaces
	namespaces, err := client.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get namespaces: %v", err)})
		return
	}

	// Get pods across all namespaces
	pods, err := client.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get pods: %v", err)})
		return
	}

	// Get deployments across all namespaces
	deployments, err := client.AppsV1().Deployments("").List(ctx, metav1.ListOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get deployments: %v", err)})
		return
	}

	// Get services across all namespaces
	services, err := client.CoreV1().Services("").List(ctx, metav1.ListOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get services: %v", err)})
		return
	}

	// Count running and failed pods
	runningPods := 0
	failedPods := 0
	for _, pod := range pods.Items {
		switch pod.Status.Phase {
		case corev1.PodRunning:
			runningPods++
		case corev1.PodFailed:
			failedPods++
		}
	}

	// Create clusters info
	clusters := make([]ClusterInfo, 0)
	if context, exists := s.contexts[cluster]; exists {
		clusterInfo := ClusterInfo{
			Name:      cluster,
			Server:    "AKS Cluster",
			Current:   true,
			Namespace: context.Namespace,
		}
		clusters = append(clusters, clusterInfo)
	}

	dashboard := DashboardData{
		Clusters:     clusters,
		Namespaces:   len(namespaces.Items),
		Pods:         len(pods.Items),
		Deployments:  len(deployments.Items),
		Services:     len(services.Items),
		RunningPods:  runningPods,
		FailedPods:   failedPods,
	}

	c.JSON(200, dashboard)
}

func (s *Server) getNamespaces(c *gin.Context) {
	cluster := c.Param("cluster")
	client, exists := s.clients[cluster]
	if !exists {
		c.JSON(404, gin.H{"error": "Cluster not found"})
		return
	}

	namespaces, err := client.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get namespaces: %v", err)})
		return
	}

	nsNames := make([]string, len(namespaces.Items))
	for i, ns := range namespaces.Items {
		nsNames[i] = ns.Name
	}

	c.JSON(200, nsNames)
}

func (s *Server) getPods(c *gin.Context) {
	cluster := c.Param("cluster")
	namespace := c.Param("namespace")
	
	client, exists := s.clients[cluster]
	if !exists {
		c.JSON(404, gin.H{"error": "Cluster not found"})
		return
	}

	pods, err := client.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get pods: %v", err)})
		return
	}

	podInfos := make([]PodInfo, len(pods.Items))
	for i, pod := range pods.Items {
		// Calculate ready containers
		readyCount := 0
		totalCount := len(pod.Status.ContainerStatuses)
		containers := make([]ContainerInfo, totalCount)
		
		for j, containerStatus := range pod.Status.ContainerStatuses {
			if containerStatus.Ready {
				readyCount++
			}
			containers[j] = ContainerInfo{
				Name:  containerStatus.Name,
				Image: containerStatus.Image,
				Ready: containerStatus.Ready,
			}
		}

		// Calculate restart count
		restartCount := int32(0)
		for _, containerStatus := range pod.Status.ContainerStatuses {
			restartCount += containerStatus.RestartCount
		}

		// Calculate age
		age := time.Since(pod.CreationTimestamp.Time).Round(time.Second).String()

		podInfos[i] = PodInfo{
			Name:       pod.Name,
			Namespace:  pod.Namespace,
			Status:     string(pod.Status.Phase),
			Ready:      fmt.Sprintf("%d/%d", readyCount, totalCount),
			Restarts:   restartCount,
			Age:        age,
			Node:       pod.Spec.NodeName,
			Labels:     pod.Labels,
			Containers: containers,
		}
	}

	c.JSON(200, podInfos)
}

func (s *Server) getDeployments(c *gin.Context) {
	cluster := c.Param("cluster")
	namespace := c.Param("namespace")
	
	client, exists := s.clients[cluster]
	if !exists {
		c.JSON(404, gin.H{"error": "Cluster not found"})
		return
	}

	deployments, err := client.AppsV1().Deployments(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get deployments: %v", err)})
		return
	}

	deploymentInfos := make([]DeploymentInfo, len(deployments.Items))
	for i, deployment := range deployments.Items {
		// Get images from containers
		images := make([]string, len(deployment.Spec.Template.Spec.Containers))
		for j, container := range deployment.Spec.Template.Spec.Containers {
			images[j] = container.Image
		}

		// Calculate age
		age := time.Since(deployment.CreationTimestamp.Time).Round(time.Second).String()

		deploymentInfos[i] = DeploymentInfo{
			Name:      deployment.Name,
			Namespace: deployment.Namespace,
			Replicas:  *deployment.Spec.Replicas,
			Ready:     deployment.Status.ReadyReplicas,
			Available: deployment.Status.AvailableReplicas,
			Age:       age,
			Labels:    deployment.Labels,
			Selector:  deployment.Spec.Selector.MatchLabels,
			Strategy:  string(deployment.Spec.Strategy.Type),
			Images:    images,
		}
	}

	c.JSON(200, deploymentInfos)
}

func (s *Server) deletePod(c *gin.Context) {
	cluster := c.Param("cluster")
	namespace := c.Param("namespace")
	podName := c.Param("pod")

	client, exists := s.clients[cluster]
	if !exists {
		c.JSON(404, gin.H{"error": "Cluster not found"})
		return
	}

	err := client.CoreV1().Pods(namespace).Delete(context.Background(), podName, metav1.DeleteOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to delete pod: %v", err)})
		return
	}

	c.JSON(200, gin.H{"message": "Pod deleted successfully"})
}

func (s *Server) scaleDeployment(c *gin.Context) {
	cluster := c.Param("cluster")
	namespace := c.Param("namespace")
	deploymentName := c.Param("deployment")

	var scaleRequest struct {
		Replicas int32 `json:"replicas"`
	}
	
	if err := c.ShouldBindJSON(&scaleRequest); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	client, exists := s.clients[cluster]
	if !exists {
		c.JSON(404, gin.H{"error": "Cluster not found"})
		return
	}

	// Get current deployment
	deployment, err := client.AppsV1().Deployments(namespace).Get(context.Background(), deploymentName, metav1.GetOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get deployment: %v", err)})
		return
	}

	// Update replicas
	deployment.Spec.Replicas = &scaleRequest.Replicas
	
	_, err = client.AppsV1().Deployments(namespace).Update(context.Background(), deployment, metav1.UpdateOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to scale deployment: %v", err)})
		return
	}

	c.JSON(200, gin.H{"message": "Deployment scaled successfully"})
}

func (s *Server) deleteDeployment(c *gin.Context) {
	cluster := c.Param("cluster")
	namespace := c.Param("namespace")
	deploymentName := c.Param("deployment")

	client, exists := s.clients[cluster]
	if !exists {
		c.JSON(404, gin.H{"error": "Cluster not found"})
		return
	}

	err := client.AppsV1().Deployments(namespace).Delete(context.Background(), deploymentName, metav1.DeleteOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to delete deployment: %v", err)})
		return
	}

	c.JSON(200, gin.H{"message": "Deployment deleted successfully"})
}

func (s *Server) getPodLogs(c *gin.Context) {
	cluster := c.Param("cluster")
	namespace := c.Param("namespace")
	podName := c.Param("pod")

	client, exists := s.clients[cluster]
	if !exists {
		c.JSON(404, gin.H{"error": "Cluster not found"})
		return
	}

	// Get pod logs
	podLogOpts := corev1.PodLogOptions{
		TailLines: func(i int64) *int64 { return &i }(100), // Get last 100 lines
	}
	
	req := client.CoreV1().Pods(namespace).GetLogs(podName, &podLogOpts)
	logs, err := req.Stream(context.Background())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get pod logs: %v", err)})
		return
	}
	defer logs.Close()

	c.Header("Content-Type", "text/plain")
	c.Status(200)
	
	// Stream logs to response
	buffer := make([]byte, 1024)
	for {
		n, err := logs.Read(buffer)
		if n > 0 {
			c.Writer.Write(buffer[:n])
			c.Writer.Flush()
		}
		if err != nil {
			break
		}
	}
}

func (s *Server) handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade websocket: %v", err)
		return
	}
	defer conn.Close()

	s.mu.Lock()
	s.wsClients[conn] = ""
	s.mu.Unlock()

	// Handle messages from client
	for {
		var msg WebSocketMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("Websocket read error: %v", err)
			break
		}

		// Store cluster context for this connection
		s.mu.Lock()
		s.wsClients[conn] = msg.Cluster
		s.mu.Unlock()
	}

	// Clean up
	s.mu.Lock()
	delete(s.wsClients, conn)
	s.mu.Unlock()
}

func (s *Server) startWatchers() {
	for clusterName, client := range s.clients {
		go s.watchPods(clusterName, client)
		go s.watchDeployments(clusterName, client)
	}
}

func (s *Server) watchPods(cluster string, client *kubernetes.Clientset) {
	for {
		watchlist, err := client.CoreV1().Pods("").Watch(context.Background(), metav1.ListOptions{})
		if err != nil {
			log.Printf("Failed to watch pods for cluster %s: %v", cluster, err)
			time.Sleep(5 * time.Second)
			continue
		}

		for event := range watchlist.ResultChan() {
			pod, ok := event.Object.(*corev1.Pod)
			if !ok {
				continue
			}

			s.broadcastToClusterClients(cluster, WebSocketMessage{
				Type:    fmt.Sprintf("pod_%s", event.Type),
				Cluster: cluster,
				Data:    pod,
			})
		}
	}
}

func (s *Server) watchDeployments(cluster string, client *kubernetes.Clientset) {
	for {
		watchlist, err := client.AppsV1().Deployments("").Watch(context.Background(), metav1.ListOptions{})
		if err != nil {
			log.Printf("Failed to watch deployments for cluster %s: %v", cluster, err)
			time.Sleep(5 * time.Second)
			continue
		}

		for event := range watchlist.ResultChan() {
			deployment, ok := event.Object.(*appsv1.Deployment)
			if !ok {
				continue
			}

			s.broadcastToClusterClients(cluster, WebSocketMessage{
				Type:    fmt.Sprintf("deployment_%s", event.Type),
				Cluster: cluster,
				Data:    deployment,
			})
		}
	}
}

func (s *Server) broadcastToClusterClients(cluster string, message WebSocketMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Create a list of connections to avoid concurrent map access
	var connectionsToNotify []*websocket.Conn
	var connectionsToRemove []*websocket.Conn

	for conn, connCluster := range s.wsClients {
		if connCluster == cluster || connCluster == "" {
			connectionsToNotify = append(connectionsToNotify, conn)
		}
	}

	// Send messages outside the map iteration with proper locking per connection
	for _, conn := range connectionsToNotify {
		// Check if connection is still valid
		if _, exists := s.wsClients[conn]; !exists {
			continue
		}

		err := conn.WriteJSON(message)
		if err != nil {
			log.Printf("Failed to send websocket message: %v", err)
			conn.Close()
			connectionsToRemove = append(connectionsToRemove, conn)
		}
	}

	// Remove failed connections
	for _, conn := range connectionsToRemove {
		delete(s.wsClients, conn)
	}
}