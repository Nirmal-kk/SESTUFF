pipeline {
    agent any

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Retrieving source code from repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node backend dependencies...'
                dir("${env.BACKEND_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Run Unit & Integration Tests') {
            steps {
                echo 'Executing Jest API test suite...'
                dir("${env.BACKEND_DIR}") {
                    sh 'npm test'
                }
            }
        }

        stage('Docker Compose Build') {
            steps {
                echo 'Building Docker images with Docker Compose...'
                sh 'docker compose build'
            }
        }

        stage('Docker Deploy & Health Check') {
            steps {
                echo 'Starting containers in background...'
                sh 'docker compose up -d'
                
                echo 'Waiting for services to initialize...'
                // Wait for the backend health check to succeed (port 5000)
                sh '''
                    for i in {1..10}; do
                        if curl -s http://localhost:5000/api/health | grep '"status":"OK"'; then
                            echo "Backend API health check passed!"
                            break
                        fi
                        echo "Waiting for API to start..."
                        sleep 3
                    done
                '''
                
                echo 'Running smoke test against frontend server...'
                sh 'curl -I http://localhost:8080'
            }
            post {
                always {
                    echo 'Cleaning up Docker containers...'
                    sh 'docker compose down'
                }
            }
        }
    }

    post {
        success {
            echo 'LuxeStay CI/CD pipeline finished successfully!'
        }
        failure {
            echo 'LuxeStay pipeline failed. Review stage output logs.'
        }
    }
}
