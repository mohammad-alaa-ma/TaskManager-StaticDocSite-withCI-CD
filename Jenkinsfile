pipeline {
    agent any

    environment {
        // Credentials stored in Jenkins as Username/Password
        DOCKERHUB_CREDS = credentials('dockerhub-creds')  // Docker Hub username/password
        GIT_CREDS = credentials('github-creds')           // GitHub username/password
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/mohammad-alaa-ma/app1withci-cd.git', credentialsId: 'github-creds'
            }
        }

        stage('Build & Push Frontend') {
            when {
                changeset "**/frontend/**"
            }
            steps {
                script {
                    def IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()

                    // Docker login and build/push frontend
                    sh "docker login -u $DOCKERHUB_CREDS_USR -p $DOCKERHUB_CREDS_PSW"
                    sh "docker build -t mohammadalaa953/taskmanagerk8strial:frontend-$IMAGE_TAG ./frontend"
                    sh "docker push mohammadalaa953/taskmanagerk8strial:frontend-$IMAGE_TAG"

                    // Update Kubernetes manifest
                    sh "sed -i 's|image: .*taskmanagerk8strial:frontend.*|image: mohammadalaa953/taskmanagerk8strial:frontend-$IMAGE_TAG|' k8syamlfiles/frontend.yaml"

                    // Push updated manifest to GitHub
                    sh """
                        git config user.name "$GIT_CREDS_USR"
                        git config user.email "jenkins@ci"
                        git add k8syamlfiles/frontend.yaml
                        git commit -m 'ci: update frontend image to $IMAGE_TAG' || echo 'no changes'
                        git push https://$GIT_CREDS_USR:$GIT_CREDS_PSW@github.com/mohammad-alaa-ma/app1withci-cd main || echo 'push failed'
                    """
                }
            }
        }

        stage('Build & Push Backend') {
            when {
                changeset "**/backend/**"
            }
            steps {
                script {
                    def IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    
                    // Docker login and build/push backend
                    sh "docker login -u $DOCKERHUB_CREDS_USR -p $DOCKERHUB_CREDS_PSW"
                    sh "docker build -t mohammadalaa953/taskmanagerk8strial:backend-$IMAGE_TAG ./backend"
                    sh "docker push mohammadalaa953/taskmanagerk8strial:backend-$IMAGE_TAG"

                    // Update Kubernetes manifest
                    sh "sed -i 's|image: .*taskmanagerk8strial:backend.*|image: mohammadalaa953/taskmanagerk8strial:backend-$IMAGE_TAG|' k8syamlfiles/backend.yaml"

                    // Push updated manifest to GitHub
                    sh """
                        git config user.name "$GIT_CREDS_USR"
                        git config user.email "jenkins@ci"
                        git add k8syamlfiles/backend.yaml
                        git commit -m 'ci: update backend image to $IMAGE_TAG' || echo 'no changes'
                        git push https://$GIT_CREDS_USR:$GIT_CREDS_PSW@github.com/mohammad-alaa-ma/app1withci-cd main || echo 'push failed'
                    """
                }
            }
        }
    }
}

