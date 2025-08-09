# Knowledge Base System

A Flask-based knowledge base system for educational institutions with role-based access control and article management.

## Features

- **User Management**: Role-based access control (Administrator, Editor, Authorized Reader, Guest Reader)
- **Article Management**: Create, read, update, delete articles with rich content support
- **Category System**: Hierarchical categorization with top categories and subcategories
- **Media Management**: Upload and manage images, videos, and documents
- **Search and Filtering**: Advanced search and filtering capabilities
- **API-First Design**: RESTful API for frontend integration

## Prerequisites

- Python 3.8+
- MySQL 8.0+
- pip

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd knowledge-base
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=mysql+pymysql://username:password@localhost/knowledge_base
   JWT_SECRET_KEY=your-secret-key-here
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

5. **Set up database**
   ```sql
   CREATE DATABASE knowledge_base CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

6. **Run the application**
   ```bash
   python run.py
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password

### Articles
- `GET /api/articles/` - Get articles with filtering
- `GET /api/articles/<id>` - Get specific article
- `POST /api/articles/` - Create new article
- `PUT /api/articles/<id>` - Update article
- `DELETE /api/articles/<id>` - Delete article
- `POST /api/articles/<id>/publish` - Publish article
- `POST /api/articles/<id>/unpublish` - Unpublish article

### Categories
- `GET /api/categories/top-categories` - Get top categories
- `POST /api/categories/top-categories` - Create top category
- `PUT /api/categories/top-categories/<id>` - Update top category
- `DELETE /api/categories/top-categories/<id>` - Delete top category
- `GET /api/categories/subcategories` - Get subcategories
- `POST /api/categories/subcategories` - Create subcategory
- `PUT /api/categories/subcategories/<id>` - Update subcategory
- `DELETE /api/categories/subcategories/<id>` - Delete subcategory
- `GET /api/categories/groups` - Get groups
- `POST /api/categories/groups` - Create group

### Users (Admin only)
- `GET /api/users/` - Get all users
- `POST /api/users/` - Create user
- `GET /api/users/<id>` - Get specific user
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user
- `POST /api/users/<id>/reset-password` - Reset user password
- `GET /api/users/roles` - Get all roles
- `POST /api/users/bulk-import` - Bulk import users from CSV

### Media
- `POST /api/media/upload` - Upload media file
- `GET /api/media/<id>` - Get media file
- `DELETE /api/media/<id>` - Delete media file
- `GET /api/media/article/<id>/media` - Get article media
- `POST /api/media/article/<id>/media` - Add media to article
- `DELETE /api/media/article/<id>/media/<media_id>` - Remove media from article
- `PUT /api/media/article/<id>/media/<media_id>` - Update media position

## Database Schema

The system uses a comprehensive database schema with the following main entities:

- **Users**: User accounts with roles
- **Articles**: Content articles with rich text support
- **Categories**: Hierarchical categorization system
- **Groups**: Student groups with specializations
- **Media**: File storage for images, videos, and documents
- **Institution Types**: Types of educational institutions

## User Roles

1. **Administrator**: Full system access, user management, content management
2. **Editor**: Content creation and editing, category management
3. **Authorized Reader**: Access to staff-only content, article viewing
4. **Guest Reader**: Access to public content only

## Development

### Project Structure
```
knowledge-base/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── auth/
│   ├── articles/
│   ├── categories/
│   ├── users/
│   └── media/
├── run.py
├── config.py
├── requirements.txt
└── README.md
```

### Running Tests
```bash
python -m pytest tests/
```

### Database Migrations
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
