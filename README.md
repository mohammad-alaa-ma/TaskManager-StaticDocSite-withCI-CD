# Complete Documentation for Task Manager K8s CI/CD Project

## Project Overview

This project demonstrates a full-stack task management application deployed on a Kubernetes cluster with a complete CI/CD pipeline. The application consists of a frontend (static HTML/JS), backend (Node.js/Express), and an external MySQL database. The CI/CD pipeline automates deployment using GitHub, Jenkins, DockerHub, and ArgoCD for GitOps.

Key features:
- **Automated Builds and Deployments**: Code changes trigger Jenkins via GitHub webhooks, building new Docker images tagged with commit hashes.
- **GitOps with ArgoCD**: ArgoCD monitors GitHub for YAML changes and applies them to the K8s cluster.
- **Ingress Routing**: Routes traffic to the main app or a static documentation page.
- **External Database**: Uses an external MySQL database (not managed by K8s).

## Project Architecture

### High-Level Architecture

```
GitHub (Code + K8s YAMLs)
    ↓ (Webhook)
Jenkins (CI/CD Server)
    ↓ (Build & Push)
DockerHub (Image Registry)
    ↓ (Update YAMLs)
GitHub (Updated YAMLs)
    ↓ (Sync)
ArgoCD (GitOps Controller)
    ↓ (Apply)
Kubernetes Cluster
    ├── Ingress (NGINX)
    │   ├── / (Frontend Service)
    │   └── /docs (Static Docs Service)
    ├── Frontend Deployment (Nginx serving static files)
    ├── Backend Deployment (Node.js API)
    └── External MySQL DB (via IP)
```

### Components

- **Frontend**: Static HTML/JS served by Nginx, communicates with backend via API calls.
- **Backend**: Node.js/Express API server, connects to external MySQL database.
- **Database**: External MySQL instance (not in K8s), accessed via IP address.
- **Kubernetes Cluster**: Hosts deployments, services, and ingress.
- **ArgoCD**: GitOps tool that syncs K8s manifests from GitHub.
- **Jenkins**: CI/CD server that builds images and updates manifests.
- **GitHub**: Code repository with webhooks to trigger Jenkins.
- **DockerHub**: Registry for storing built Docker images.
- **Ingress**: NGINX ingress controller routing traffic.

### Data Flow

1. User interacts with frontend UI.
2. Frontend makes API calls to backend (routed via Ingress).
3. Backend queries/updates external MySQL database.
4. Changes are reflected bidirectionally.

## Directory Structure and Purpose

```
app1withci-cd/
├── README.md                           # Project overview and setup instructions
├── Jenkinsfile                         # Jenkins pipeline configuration
├── docker-compose.yaml                 # Local development setup
├── argo-app.yaml                       # ArgoCD application definition
├── init.sql                            # Database initialization script
├── backend/                            # Backend application
│   ├── Dockerfile                      # Backend container build
│   ├── package.json                    # Node.js dependencies
│   ├── server.js                       # Express API server
│   └── .dockerignore                   # Docker ignore file
├── frontend/                           # Frontend application
│   ├── Dockerfile                      # Frontend container build
│   ├── index.html                      # Main UI (HTML/CSS/JS)
│   └── .dockerignore                   # Docker ignore file
├── doc-static-page/                    # Static documentation website
│   ├── Dockerfile                      # Docs container build
│   ├── index.html                      # Docs homepage
│   ├── overview.html                   # Project overview page
│   ├── architecture.html               # Architecture details
│   ├── services.html                   # Services documentation
│   ├── traffic.html                    # Traffic flow documentation
│   ├── style.css                       # CSS styles
│   ├── nginx.conf                      # Nginx configuration
│   └── img.png                         # Architecture diagram image
└── k8syamlfiles/                       # Kubernetes manifests
    ├── namespace.yaml                  # K8s namespace definition
    ├── frontend.yaml                   # Frontend deployment/service
    ├── backend.yaml                    # Backend deployment/service
    ├── documentaiondeployment.yaml     # Static docs deployment/service
    ├── ingress.yaml                    # Ingress routing rules
    └── secretsForDBUsedByBackend.yaml  # DB credentials secret
```

## CI/CD Pipeline Details

### Jenkins Pipeline (Jenkinsfile)

The pipeline consists of two stages triggered by changeset detection:

1. **Build & Push Frontend**: When `frontend/` files change
   - Gets commit hash as tag
   - Builds Docker image: `mohammadalaa953/taskmanagerk8strial:frontend-<commit-hash>`
   - Pushes to DockerHub
   - Updates `k8syamlfiles/frontend.yaml` with new image tag
   - Commits and pushes changes back to GitHub

2. **Build & Push Backend**: When `backend/` files change
   - Gets commit hash as tag
   - Builds Docker image: `mohammadalaa953/taskmanagerk8strial:backend-<commit-hash>`
   - Pushes to DockerHub
   - Updates `k8syamlfiles/backend.yaml` with new image tag
   - Commits and pushes changes back to GitHub

### GitOps with ArgoCD

- ArgoCD monitors the `k8syamlfiles/` directory in GitHub
- When YAML files are updated by Jenkins, ArgoCD detects changes
- Automatically syncs the changes to the K8s cluster
- Uses automated sync with pruning and self-healing

## Baby Steps Setup and Deployment

### Prerequisites

- GitHub repository with this code
- Jenkins server with:
  - GitHub and Docker plugins
  - Credentials: `dockerhub-creds` (username/password), `github-creds` (username/token)
  - Webhook configured in GitHub to trigger on push
- ArgoCD installed in K8s cluster
- DockerHub account
- K8s cluster (Minikube/local or cloud)
- NGINX Ingress controller installed
- External MySQL database accessible from K8s cluster

### Step-by-Step Setup

#### 1. Prepare External Database

**Note:** For production deployments, it's recommended to use a dedicated MySQL server rather than a container for better performance, persistence, and management. However, for testing/demo purposes, a container can be used.

```bash
# Option 1: Run MySQL container (for testing/demo only)
docker run -d --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=taskdb \
  -p 3306:3306 \
  mysql:8.0

# Option 2: Use a dedicated MySQL server (recommended for production)
# Install MySQL on a dedicated server/machine and create the database
# Example commands on Ubuntu/Debian:
# sudo apt update
# sudo apt install mysql-server
# sudo mysql_secure_installation
# mysql -u root -p
# CREATE DATABASE taskdb;
# CREATE USER 'appuser'@'%' IDENTIFIED BY 'securepassword';
# GRANT ALL PRIVILEGES ON taskdb.* TO 'appuser'@'%';
# FLUSH PRIVILEGES;

# Initialize database schema (run this on your MySQL server)
mysql -h <your-db-host> -u root -ppassword < init.sql
```

Note the IP address of your MySQL host (e.g., `192.168.58.1` or dedicated server IP).

#### 2. Clone and Prepare Repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

#### 3. Set Up Jenkins with Docker Support

Since Jenkins needs to build and push Docker images, it requires Docker CLI access. Create a custom Jenkins image with Docker installed:

**Create Dockerfile for Jenkins:**

```dockerfile
FROM jenkins/jenkins:lts

USER root

# Install Git and Docker CLI
RUN apt-get update && \
    apt-get install -y git docker.io && \
    rm -rf /var/lib/apt/lists/*

# Switch back to Jenkins user
USER jenkins
```

**Build the image:**

```bash
sudo docker build -t jenkins-with-docker .
```

**Run the container using your custom image:**

```bash
sudo docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -v jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --user root \
  jenkins-with-docker
```

**Important Notes:**
- Ensure the Jenkins machine is reachable over the internet for GitHub webhooks. If running on a local network (LAN), use ngrok to expose it:
  - Install ngrok: `sudo snap install ngrok` (or download from ngrok.com)
  - Run: `ngrok http 8080`
  - Use the ngrok URL (e.g., `https://abc123.ngrok.io`) as the Jenkins URL in webhooks.

#### 4. Configure Jenkins Pipeline

- Install Jenkins with required plugins: Git, GitHub, Docker Pipeline
- Add credentials:
  - `dockerhub-creds`: DockerHub username/password
  - `github-creds`: GitHub username/personal access token
- Create a new pipeline job:
  - Pipeline script from SCM
  - Repository URL: your GitHub repo
  - Script Path: `Jenkinsfile`
- Configure GitHub webhook:
  - In GitHub repo: Settings → Webhooks → Add webhook
  - Payload URL: `http://your-jenkins-url/github-webhook/` (use ngrok URL if in LAN)
  - Content type: `application/json`
  - Events: Just the `push` event

#### 4. Configure ArgoCD Application

```bash
# Install ArgoCD CLI if not already installed
# Apply the ArgoCD application manifest
kubectl apply -f argo-app.yaml
```

Update `argo-app.yaml` with your repo URL if different.

#### 5. Deploy Initial Manifests

```bash
# Apply namespace
kubectl apply -f k8syamlfiles/namespace.yaml

# Apply secrets (update with your DB credentials)
kubectl apply -f k8syamlfiles/secretsForDBUsedByBackend.yaml

# Apply deployments and services
kubectl apply -f k8syamlfiles/frontend.yaml
kubectl apply -f k8syamlfiles/backend.yaml
kubectl apply -f k8syamlfiles/documentaiondeployment.yaml

# Apply ingress
kubectl apply -f k8syamlfiles/ingress.yaml
```

Update `k8syamlfiles/backend.yaml` with your external DB IP address.

#### 6. Test Initial Deployment

```bash
# Check pod status
kubectl get pods -n app1

# Check services
kubectl get svc -n app1

# Check ingress
kubectl get ingress -n app1

# Access the application (update hosts file or DNS for domains)
# Frontend: http://app1.example.com
# Docs: http://nginx.example.com
```

#### 7. Test CI/CD Pipeline

```bash
# Make a change to frontend code
echo "<!-- test change -->" >> frontend/index.html

# Commit and push
git add frontend/index.html
git commit -m "test: add comment to frontend"
git push origin main
```

Monitor:
- Jenkins: Should trigger build, push image, update YAML
- GitHub: Should show new commit from Jenkins
- ArgoCD: Should sync the changes
- K8s: Should rollout new frontend deployment

```bash
# Check rollout status
kubectl rollout status deployment/app1-frontend -n app1
```

#### 8. Local Development (Optional)

```bash
# Use docker-compose for local testing
docker-compose up -d

# Access locally:
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
# DB: localhost:3306
```

## Key Configuration Notes

### Database Connection

- Backend connects to external MySQL via IP (not service name)
- Credentials stored in K8s secrets
- Update `DB_HOST` in `backend.yaml` with your DB IP

### Ingress Routing

- `/api/*` → Backend service (port 3000)
- `/` → Frontend service (port 80)
- `/docs` → Static docs service (port 80)

### Image Tagging

- Images tagged with Git commit hash for traceability
- Jenkins updates YAML files with new image tags
- ArgoCD applies the updated manifests

### Security Considerations

- External DB access (consider VPN or private networking)
- DockerHub credentials in Jenkins (use secrets management)
- GitHub tokens with minimal permissions

## Troubleshooting

### Common Issues

1. **ArgoCD not syncing**: Check ArgoCD application status and repo access
2. **Jenkins build fails**: Verify credentials and DockerHub access
3. **Pods not starting**: Check logs, resource limits, and DB connectivity
4. **Ingress not routing**: Verify ingress class and host configurations

### Useful Commands

```bash
# Check ArgoCD app status
argocd app get app1

# View Jenkins logs
# Access Jenkins UI or check console output

# Debug pod issues
kubectl logs -n app1 <pod-name>
kubectl describe pod -n app1 <pod-name>

# Check DB connectivity from backend
kubectl exec -n app1 -it <backend-pod> -- nc -zv <db-ip> 3306
```

This setup demonstrates modern DevOps practices with automated CI/CD, GitOps, and containerized deployments on Kubernetes.
