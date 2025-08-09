# Deployment Guide

This guide covers deploying the Knowledge Base System to production.

## Prerequisites

- Python 3.8+
- MySQL 8.0+
- Nginx (recommended)
- Gunicorn (for production)

## Production Setup

### 1. Environment Variables

Create a `.env` file in the production environment:

```env
# Database
DATABASE_URL=mysql+pymysql://username:password@localhost/knowledge_base

# Security
JWT_SECRET_KEY=your-super-secret-jwt-key-here
SECRET_KEY=your-super-secret-flask-key-here

# Environment
FLASK_ENV=production
FLASK_DEBUG=False
```

### 2. Database Setup

```sql
-- Create database
CREATE DATABASE knowledge_base CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'kb_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON knowledge_base.* TO 'kb_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Application Setup

```bash
# Clone repository
git clone <repository-url>
cd knowledge-base

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install production dependencies
pip install gunicorn

# Initialize database
python init_db.py

# Test the application
python test_api.py
```

### 4. Gunicorn Configuration

Create `gunicorn.conf.py`:

```python
# Gunicorn configuration
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 50
preload_app = True
```

### 5. Systemd Service

Create `/etc/systemd/system/knowledge-base.service`:

```ini
[Unit]
Description=Knowledge Base System
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/knowledge-base
Environment="PATH=/path/to/knowledge-base/venv/bin"
ExecStart=/path/to/knowledge-base/venv/bin/gunicorn -c gunicorn.conf.py run:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable knowledge-base
sudo systemctl start knowledge-base
sudo systemctl status knowledge-base
```

### 6. Nginx Configuration

Create `/etc/nginx/sites-available/knowledge-base`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /path/to/knowledge-base/static;
        expires 30d;
    }

    # Increase upload size for media files
    client_max_body_size 100M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/knowledge-base /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL Certificate (Optional)

Using Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring

### 1. Logs

Check application logs:

```bash
sudo journalctl -u knowledge-base -f
```

Check Nginx logs:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Health Check

Create a health check endpoint in your application:

```python
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200
```

### 3. Backup Strategy

#### Database Backup

Create a backup script `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_NAME="knowledge_base"
DB_USER="kb_user"
DB_PASS="your_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/knowledge_base_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/knowledge_base_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "knowledge_base_*.sql.gz" -mtime +30 -delete

echo "Backup completed: knowledge_base_$DATE.sql.gz"
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check database credentials in `.env`
   - Verify MySQL service is running
   - Check firewall settings

2. **Permission Denied**
   - Ensure proper file permissions
   - Check user/group ownership
   - Verify SELinux settings (if applicable)

3. **Memory Issues**
   - Adjust Gunicorn worker count
   - Monitor memory usage
   - Consider using worker_class = "gevent"

4. **Upload Issues**
   - Check Nginx client_max_body_size
   - Verify disk space
   - Check file permissions

### Performance Optimization

1. **Database**
   - Add indexes for frequently queried columns
   - Optimize queries
   - Consider read replicas for high traffic

2. **Application**
   - Enable caching (Redis recommended)
   - Optimize media storage (CDN for images)
   - Use connection pooling

3. **Server**
   - Monitor resource usage
   - Scale horizontally if needed
   - Use load balancer for multiple instances

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Database**
   - Use strong passwords
   - Limit database user privileges
   - Enable SSL connections

3. **Application**
   - Keep dependencies updated
   - Enable HTTPS
   - Implement rate limiting
   - Use security headers

4. **Server**
   - Configure firewall
   - Keep system updated
   - Monitor logs for suspicious activity
   - Regular security audits
