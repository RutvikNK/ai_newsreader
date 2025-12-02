#!/bin/bash

# --- CONFIGURATION ---
GCP_PROJECT_ID="cs571-final-479923"
BACKEND_IMAGE="gcr.io/${GCP_PROJECT_ID}/video-backend:latest"
FRONTEND_IMAGE="gcr.io/${GCP_PROJECT_ID}/video-frontend:latest"
NAMESPACE="default"

echo "Generating Kubernetes Manifests for Project: $GCP_PROJECT_ID"

# --- 0. DIRECTORIES ---
echo "Creating directory structure..."
mkdir -p deployments services autoscaling ingress config

# --- 1. CONFIGURATION (config/) ---

# BackendConfig (Fixes Google Load Balancer Health Check)
# This is crucial so the Load Balancer knows to check /api/stories, not /
cat <<EOF > config/backend-config.yaml
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: backend-health-check
  namespace: $NAMESPACE
spec:
  healthCheck:
    checkIntervalSec: 15
    timeoutSec: 15
    healthyThreshold: 1
    unhealthyThreshold: 2
    type: HTTP
    requestPath: /api/stories
    port: 8080
EOF

# --- 2. DEPLOYMENTS (deployments/) ---

# Backend Deployment
cat <<EOF > deployments/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: $NAMESPACE
  labels:
    app: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: $BACKEND_IMAGE
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /api/stories
            port: 8080
          initialDelaySeconds: 20
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /api/stories
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "300Mi"
EOF

# Frontend Deployment
cat <<EOF > deployments/frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: $NAMESPACE
  labels:
    app: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: $FRONTEND_IMAGE
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            cpu: "50m"
            memory: "64Mi"
          limits:
            cpu: "250m"
            memory: "128Mi"
EOF

# --- 3. SERVICES (services/) ---

# Backend Service
# Includes annotation to link with config/backend-config.yaml
cat <<EOF > services/backend.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: $NAMESPACE
  annotations:
    cloud.google.com/backend-config: '{"default": "backend-health-check"}'
spec:
  type: NodePort
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
EOF

# Frontend Service
cat <<EOF > services/frontend.yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: $NAMESPACE
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
EOF

# --- 4. AUTOSCALING (autoscaling/) ---

# Backend HPA
cat <<EOF > autoscaling/backend.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
EOF

# Frontend HPA
cat <<EOF > autoscaling/frontend.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
EOF

# --- 5. INGRESS (ingress/) ---

cat <<EOF > ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: $NAMESPACE
spec:
  ingressClassName: "gce"
  defaultBackend:
    service:
      name: frontend-service
      port:
        number: 80
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
EOF

echo "------------------------------------------------"
echo "Files created successfully!"
echo "To deploy, run the following command:"
echo "kubectl apply -f config/ -f services/ -f deployments/ -f autoscaling/ -f ingress/"