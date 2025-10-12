# Project: Task Management App with CI/CD Pipeline

## Overview

This project demonstrates a full-stack task management application deployed on a Kubernetes (K8s) cluster with a complete CI/CD pipeline. The app consists of a frontend, backend, and database, allowing users to add and manage tasks. Changes in the frontend update the database via the backend, and vice versa.

The CI/CD pipeline automates deployment using GitHub for version control, Jenkins for building and updating images/YAML files, DockerHub for image storage, and ArgoCD for continuous deployment to the K8s cluster. An Ingress controller handles routing to the application's services, including the main app and a static documentation page.

Key features:
- **Automated Builds and Deployments**: Code changes trigger Jenkins via GitHub webhooks, building new Docker images tagged with commit hashes.
- **GitOps with ArgoCD**: ArgoCD monitors GitHub for YAML changes and applies them to the K8s cluster.
- **Ingress Routing**: Routes traffic to the frontend/backend deployment or a static documentation page.

This setup showcases modern DevOps practices for scalable, automated application delivery.

## Architecture

The system integrates the following components:

- **Frontend**: A user interface for adding and viewing tasks.
- **Backend**: Handles API requests from the frontend and interacts with the database.
- **Database**: Stores task data; updates are bidirectional (frontend → database and database → frontend).
- **Kubernetes Cluster**: Hosts the deployments, services, and Ingress.
- **ArgoCD**: Syncs K8s resources with GitHub manifests (GitOps).
- **Jenkins**: CI/CD server that builds images, updates YAML files, and pushes changes back to GitHub.
- **GitHub**: Repository for code and K8s manifests; uses webhooks to notify Jenkins.
- **DockerHub**: Registry for storing built Docker images.
- **Ingress**: Routes incoming traffic:
  - `/` (or main path): Directs to the frontend deployment, which communicates with the backend and database.
  - `/docs` (or similar): Serves a static page with project documentation.

### How It Works

1. **Initial Deployment (v1)**:
   - ArgoCD detects the initial YAML manifests in GitHub.
   - It applies them to the K8s cluster, deploying the frontend, backend, and database.
   - Users can interact with the app: Adding tasks via frontend updates the database; changes in the database reflect in the frontend.

2. **Code Changes and CI/CD Trigger**:
   - Make changes to frontend, backend, or both codebases.
   - Push changes to GitHub.
   - GitHub webhook notifies Jenkins.

3. **Jenkins Pipeline**:
   - Jenkins builds new Docker image(s) for the updated component(s).
   - Tags the image(s) with the commit hash (e.g., `frontend:<commit-hash>` or `backend:<commit-hash>`).
   - Pushes the image(s) to DockerHub.
   - Updates the corresponding YAML manifest(s) in the repo to reference the new image tag(s).
   - Commits and pushes the updated YAML back to GitHub.

4. **ArgoCD Sync (v2)**:
   - ArgoCD detects the YAML changes in GitHub.
   - It applies the updates to the K8s cluster, rolling out the new deployment version (v2).
   - The app now runs with the latest code, and Ingress continues routing traffic appropriately.

5. **Ingress Routing**:
   - Traffic to the main app path goes to the frontend service, which proxies to the backend for database operations.
   - A separate path (e.g., `/docs`) serves static HTML documentation about the project.

This pipeline ensures zero-downtime deployments and maintains consistency between code, images, and cluster state.

## Prerequisites

To replicate this setup:
- A GitHub repository with code and K8s YAML manifests.
- Jenkins server configured with GitHub webhooks and access to DockerHub.
- ArgoCD installed in the K8s cluster, watching the GitHub repo.
- DockerHub account for image storage.
- Kubernetes cluster (e.g., Minikube for local testing or a cloud provider like EKS/GKE).
- Ingress controller (e.g., NGINX Ingress) configured in the cluster.

## Installation and Setup

1. **Clone the Repository**:
   ```
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

2. **Set Up Jenkins**:
   - Install Jenkins and required plugins (e.g., GitHub, Docker, Kubernetes).
   - Configure a pipeline job to trigger on webhooks, build images, update YAML, and push to GitHub.

3. **Configure ArgoCD**:
   - Install ArgoCD in your K8s cluster.
   - Create an Application resource pointing to your GitHub repo and path containing YAML manifests.

4. **Deploy Database and Services**:
   - Apply initial YAML files manually or let ArgoCD handle it.
   - Ensure Ingress YAML defines routes for the app and static docs.

5. **Test the Pipeline**:
   - Make a code change and push to GitHub.
   - Monitor Jenkins for build, DockerHub for new images, GitHub for YAML updates, and ArgoCD for sync.

## Usage

- Access the app via the Ingress URL (e.g., `http://your-domain/` for tasks).
- View documentation at `http://your-domain/docs`.
- Interact with tasks: Add via frontend to see database updates, or modify database directly to see frontend refresh.

## Demo

A screen recording is available in the `docs/` folder (or linked here: [demo.mp4](docs/demo.mp4)) showing:
- Initial v1 deployment via ArgoCD.
- Task addition and bidirectional database sync.
- Code changes triggering Jenkins build, image push, YAML update, and ArgoCD v2 rollout.
- Ingress routing to app and static docs.

