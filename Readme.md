# 📹 Watchly API

## 📋 Description

This project is YouTube Clone REST API built with Node.js. It replicates core functionalities of YouTube and provides secure authentication using JWT. Fully containerized and available on Docker Hub for easy deployment.

---

## 🚀 Features

✅ AI Integration\
✅ JWT Authentication\
✅ RESTful API\
✅ Dockerized & Hosted on Docker Hub\
✅ Environment Configurable

---

## ⚙️ Prerequisites

- Docker installed
- (Optional) Node.js and npm if running locally

---

## 🐳 Run with Docker (No need to build — image hosted on Docker Hub)

### 🔗 Docker Hub Image:

👉 [https://hub.docker.com/r/dodoxd/watchly](https://hub.docker.com/r/dodoxd/watchly)

### 🚀 Pull and Run:

```bash
docker pull dodoxd/watchly
```

```bash
docker run --env-file .env -p 3000:3000 dodoxd/watchly
```

> Replace `3000:3000` with your desired port if needed.\
> Create a .env file using the mentioned environment configuration.

---

## 💾 Install and Run Locally (Optional)

```bash
npm install
```

```bash
npm run start
```

✅ Run in dev mode

```bash
npm run dev
```

---

## ⚠️ Environment Variables (`.env` Example)

```
PORT=3000
MONGO_URI=your-mongodb-uri
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=your-access-secrect
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=cloudinary-cloud-name
CLOUDINARY_API_KEY=cloudinary-api-key
CLOUDINARY_API_SECRET=cloudinary-api-secret
OPENAI_API_KEY=openai-api-key
```

✅ **Note:** Never commit real secrets to GitHub.

---

## 📢 API Endpoints Example

## 🔗 Base URL

```
http://localhost:3000/api/v1/
```

> Replace `3000` with your port if changed.

### 📅 **User APIs**

| Method | Endpoint                   | Description            |
| ------ | -------------------------- | ---------------------- |
| POST   | `/users/register`          | Register a new user    |
| POST   | `/users/login`             | User login             |
| POST   | `/users/logout`            | Logout user            |
| POST   | `/users/refresh-token`     | Refresh access token   |
| POST   | `/users/change-password`   | Change user password   |
| GET    | `/users/get-user`          | Get user details       |
| PATCH  | `/users/update-user`       | Update user details    |
| PATCH  | `/users/update-avatar`     | Update avatar image    |
| PATCH  | `/users/update-cover-img`  | Update cover image     |
| GET    | `/users/c/:username`       | Get user channel       |
| POST   | `/users/subscribe-channel` | Subscribe to a channel |
| GET    | `/users/history`           | Get user watch history |

### 📽 **Video APIs**

| Method | Endpoint                   | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| GET    | `/videos`                  | Get all videos                     |
| POST   | `/videos`                  | Publish a new video                |
| GET    | `/videos/v/:videoId`       | Get video by ID                    |
| DELETE | `/videos/v/:videoId`       | Delete video by ID                 |
| PATCH  | `/videos/v/:videoId`       | Update video details               |
| GET    | `/videos/generate-ai-desc` | Get AI-Generated Video Description |

### 🔍 **Playlist APIs**

| Method | Endpoint                                | Description                |
| ------ | --------------------------------------- | -------------------------- |
| POST   | `/playlist`                             | Create a playlist          |
| GET    | `/playlist/my-playlists`                | Get user playlists         |
| GET    | `/playlist/:playlistId`                 | Get playlist by ID         |
| PATCH  | `/playlist/:playlistId`                 | Update playlist            |
| DELETE | `/playlist/:playlistId`                 | Delete playlist            |
| PATCH  | `/playlist/add/:videoId/:playlistId`    | Add video to playlist      |
| PATCH  | `/playlist/remove/:videoId/:playlistId` | Remove video from playlist |

### 👍 **Like APIs**

| Method | Endpoint                    | Description         |
| ------ | --------------------------- | ------------------- |
| POST   | `/likes/toggle/v/:videoId`  | Toggle video like   |
| GET    | `/likes/videos`             | Get liked videos    |
| POST   | `/like/toggle/t/:tweetId`   | Toggle tweet like   |
| POST   | `/like/toggle/c/:commentId` | Toggle comment like |

### 👇 **Tweet APIs**

| Method | Endpoint               | Description     |
| ------ | ---------------------- | --------------- |
| POST   | `/tweets`              | Create a tweet  |
| GET    | `/tweets/user/:userId` | Get user tweets |
| PATCH  | `/tweets/:tweetId`     | Update tweet    |
| DELETE | `/tweets/:tweetId`     | Delete tweet    |

### 💬 **Comment APIs**

| Method | Endpoint                 | Description              |
| ------ | ------------------------ | ------------------------ |
| GET    | `/comments/:videoId`     | Get comments for a video |
| POST   | `/comments/:videoId`     | Add comment to a video   |
| PATCH  | `/comments/c/:commentId` | Update a comment         |
| DELETE | `/comments/c/:commentId` | Delete a comment         |

### 📊 **Dashboard APIs**

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/dashboard/videos` | Get dashboard videos |
| GET    | `/dashboard/stats`  | Get dashboard stats  |

### ❤️ **Health Check**

| Method | Endpoint       | Description      |
| ------ | -------------- | ---------------- |
| GET    | `/healthcheck` | Check API health |

---

## 🚀 Upcoming Features

✅ Frontend Clone

---

## 📢 Suggestions & Feedback

I am open to suggestions and feedback to improve this project. Feel free to create an issue or reach out!

---
