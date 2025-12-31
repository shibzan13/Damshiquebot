# Deploying Damshique Intelligence to AWS EC2

This guide is designed for complete beginners. Follow these steps exactly to get your project live on the cloud.

## Phase 1: Create the Server (AWS Console)

1.  **Log in** to your [AWS Management Console](https://console.aws.amazon.com/).
2.  Search for **EC2** and click **Launch Instance**.
3.  **Name**: `Damshique-Server`.
4.  **OS Image**: Select **Ubuntu** (Ubuntu Server 24.04 LTS or 22.04 LTS).
5.  **Instance Type**: Select `t3.medium` (Recommended) or `t2.large`. 
    *   *Note: `t2.micro` is free but might be too slow for the AI/OCR processing.*
6.  **Key Pair**: Create a new key pair (e.g., `damshique-key`). **Download the .pem file** and keep it safe!
7.  **Network Settings**: Check the boxes:
    *   [x] Allow SSH traffic from Anywhere (or My IP)
    *   [x] Allow HTTP traffic from the internet
    *   [x] Allow HTTPS traffic from the internet
8.  **Storage**: Set to **30 GB** (gp3).
9.  Click **Launch Instance**.

## Phase 2: Connect to Server

1.  Get the **Public IPv4 address** of your new instance from the EC2 dashboard.
2.  Open your terminal (PowerShell or Command Prompt on Windows).
3.  Connect using SSH (replace path and IP):
    ```bash
    ssh -i "path\to\damshique-key.pem" ubuntu@YOUR_SERVER_IP
    ```
    *(If it says permission denied on the key, you may need to restrict permissions or use PuTTY).*

## Phase 3: Setup & Deploy

Once you are black-screen terminal (inside the server):

1.  **Clone Your Code**:
    *   You need to get your files here. The easiest way is using `git` if you pushed this code to GitHub.
    *   Alternatively, you can just manually create the files, but Git is better.
    ```bash
    git clone https://github.com/YOUR_GITHUB_USER/whatsapp-expense-ai.git
    cd whatsapp-expense-ai
    ```

    *(No GitHub? You can copy files using SCP or drag-and-drop if using an advanced terminal client like MobaXterm)*.

2.  **Run the Setup Script**:
    ```bash
    chmod +x setup_aws.sh
    sudo ./setup_aws.sh
    ```
    *Wait for it to finish installing Docker.*

3.  **Configure Secrets**:
    ```bash
    nano .env
    ```
    *Paste your `.env` content here. (Right-click usually pastes).*
    *Press `Ctrl+X`, then `Y`, then `Enter` to save.*

4.  **Start the System**:
    ```bash
    sudo docker-compose up -d --build
    ```

## Phase 4: Go Live

1.  **DNS**: Go to your domain provider settings.
2.  Update the **A Record** for `damshique.online` to point to your EC2 instance's **Public IPv4 Address**.
3.  Wait a few minutes.
4.  Visit `https://damshique.online`!

## Debugging

- **View Logs**: `sudo docker-compose logs -f`
- **Restart**: `sudo docker-compose restart`
