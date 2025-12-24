# Helio: Real-Time Collaborative Development Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Production_Ready-success.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![React](https://img.shields.io/badge/React-v18-blue.svg)

> **"Code Together, Build Faster."**
>
> Helio is a robust, distributed collaborative code editor designed for real-time engineering teams. It allows developers from across the globe to write, debug, and execute code in a shared environment with **zero latency** and **mathematically proven data consistency**.

---

## 💎 Core Features

### 1. 🚀 Real-Time Collaboration (CRDTs)
*   **Conflict-Free Editing**: Powered by **Yjs** and **CRDTs (Conflict-Free Replicated Data Types)**, ensuring that multiple users can type simultaneously without ever overwriting each other's work.
*   **Live Presence**: See exactly where your team members are working with color-coded remote cursors and selection highlights.

### 2. 🔐 Enterprise-Grade Authentication
*   **Dual-Login System**: Sign in using either your **Email** or a custom **Username**.
*   **Secure Registration**: Multi-step flow with **Email Verification (OTP)** via Brevo.
*   **Session Management**: Stateless authentication using **JWT (JSON Web Tokens)** with secure HTTP headers.
*   **Password Security**: Industry-standard **Bcrypt** hashing strategies.

### 3. ⚡ Code Execution Engine
*   **Multi-Language Support**: Run C++, Python, Java, JavaScript, and more directly in the browser.
*   **Sandboxed Environment**: Powered by the **Piston API** for secure, isolated code execution.
*   **Unlimited Scale**: No rate limits or local binaries required on the host server.

### 4. 🎨 Smart UI & Whiteboard
*   **Integrated Whiteboard**: A shared infinite canvas for system design diagrams (Architecture, Flowcharts).
*   **Atomic Design System**: A custom-built UI library using glassmorphism and semantic CSS variables.

---

## 🏗 System Architecture (Deep Dive)

### 1. High-Level System Context
This diagram illustrates the macro-level interaction between the Client, the Platform Routing Layer, and the Core Services.

```mermaid
graph TD
    user((User / Developer))
    
    subgraph Client_Layer ["💻 Client Layer (React 18)"]
        Landing["Landing Page\n(Room Generation)"]
        Dashboard["User Dashboard\n(History & Social)"]
        Editor["Editor Engine\n(Monaco + Yjs)"]
    end
    
    subgraph Platform_Layer ["☁️ Platform / Infrastructure"]
        LB["Render Load Balancer\n(HTTPS / WSS Termination)"]
        CDN["Vercel Edge Network\n(Static Assets)"]
    end
    
    subgraph Server_Layer ["⚙️ Application Server (Node.js)"]
        API["Express REST API"]
        Socket["Socket.io Service"]
        Auth["Passport Auth Control"]
        Exec["Code Runner Service"]
    end
    
    subgraph Data_Layer ["💾 Persistence (MongoDB Atlas)"]
        Users[(User Collection)]
        Rooms[(Room Collection)]
        Chats[(RoomMessage Collection)]
        Logs[(AuditLog Collection)]
        Friends[(FriendRequest Collection)]
    end
    
    subgraph External_Services ["🌍 3rd Party APIs"]
        Google[Google OAuth]
        Brevo[Brevo Email API]
        Piston[Piston Code Sandbox]
    end

    %% Flows
    user --> CDN
    CDN --> Client_Layer
    Client_Layer --> LB
    LB --> API
    LB --> Socket
    
    API --> Auth
    Auth --> Users
    Auth <--> Google
    Auth --> Brevo
    
    Socket <--> Editor
    Socket --> Rooms
    Socket --> Chats
    
    Editor --> Exec
    Exec <--> Piston
    Exec --> Logs
```

### 2. Authentication & Room Lifecycle
How a user enters the system, authenticates, and how Rooms are lazily created.

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant DB as MongoDB
    
    Note over User, Client: Scenario A: Anonymous Guest
    User->>Client: Clicks "Generate Room"
    Client->>Client: Generates UUID (v4)
    Client->>User: Redirects to /editor/:uuid
    Note right of Client: Room is NOT yet in DB
    
    User->>Client: Joins via Socket
    Client->>API: Socket.emit('JOIN', {roomId})
    API->>DB: Room.findOne(roomId)
    DB-->>API: null
    API->>User: Returns "Ephemeral Session"
    Note right of DB: Anonymous rooms are transient\nuntil data is saved.
    
    Note over User, Client: Scenario B: Logged In User
    User->>Client: Login (Email/Pass or Google)
    Client->>API: POST /auth/login
    API->>DB: Verify Credentials
    DB-->>API: User Document
    API-->>Client: JWT Token
    
    User->>Client: Creates Room
    Client->>API: Socket.emit('JOIN', {roomId, userId})
    API->>DB: Room.create({ owner: userId, members: [userId] })
    DB-->>API: New Room Doc
    API->>DB: User.addToSet({ recentRooms: roomId })
    Note right of DB: Room is now PERSISTED in history.
```

### 3. Data Persistence & Schema Map
A breakdown of exactly what is stored in the database.

| Collection | Key Fields | Purpose |
| :--- | :--- | :--- |
| **Users** | `username`, `email`, `password` (hash), `friends` (ref), `recentRooms` (ref) | Identity & Social Graph root. |
| **Rooms** | `roomId`, `files` (array), `whiteboardElements` (array), `owner` (ref) | Stores the code content and canvas state. |
| **RoomMessages** | `roomId`, `message`, `sender`, `timestamp` | Persists chat history for the room. |
| **FriendRequests** | `sender`, `receiver`, `status` (PENDING/ACCEPTED) | Manages the social handshake protocol. |
| **AuditLogs** | `roomId`, `action` ("CODE_RUN"), `codeSnapshot`, `timestamp` | Security compliance; tracks code run events. |

### 4. Real-Time Collaboration Logic (Yjs + Socket.io)
How 10 users can type at once without conflicts.

```mermaid
flowchart LR
    UserA[User A types 'f']
    UserB[User B types 'u']
    
    subgraph ClientA
        YjsA[Yjs Doc A]
        VecA[Vector Clock: 1,0]
    end
    
    subgraph ClientB
        YjsB[Yjs Doc B]
        VecB[Vector Clock: 0,1]
    end
    
    UserA --> YjsA
    UserB --> YjsB
    
    YjsA --Bin Update--> Server((Socket Server))
    YjsB --Bin Update--> Server
    
    Server --Broadcast--> ClientB
    Server --Broadcast--> ClientA
    
    ClientA --> Merge[Merge Algorithms]
    ClientB --> Merge
    
    Merge --> Result["func"]
    
    Result -.-> Note["Commutative property ensures\nboth clients end up with 'func'"]
    style Note fill:#fff,stroke:#333,stroke-dasharray: 5 5
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 | Declarative UI Library |
| | Monaco code editor | Text Editor Component |
| | Socket.io-Client | Real-time WebSocket Communication |
| | Axios | HTTP Requests |
| **Backend** | Node.js & Express | Server Runtime & API Framework |
| | Socket.io | Event-based Bidirectional Communication |
| | Mongoose | MongoDB Object Modeling |
| **Security** | JSON Web Token (JWT) | Stateless Authentication |
| | Bcrypt.js | Password Hashing |
| | Helmet & Rate-Limit | API Security Hardening |
| **External** | Piston API | Remote Code Execution Sandbox |
| | Brevo (formerly Sendinblue) | Transactional Email Service (OTP) |

---

## 🧩 Key Algorithms

### 1. Conflict-Free Replicated Data Types (CRDTs)
To solve the "Split-Brain" problem in distributed systems (where two users edit the same line offline), we use Yjs.
*   **Vector Clocks**: Tracks the 'time' of edits relative to each client.
*   **Differential Synchronization**: Only sends small binary updates (deltas) over the wire, not the whole file.

### 2. Exponential Backoff (Resilience)
Custom retry logic is implemented for the Piston API calls. If the sandbox is busy, the system waits `2^n` ms before retrying, preventing server overload.

---

## 👨‍💻 Getting Started (Local Development)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Deep99739/Helio.git
    cd Helio
    ```

2.  **Install Dependencies**
    ```bash
    # Root (Concurrent Runner)
    npm install
    
    # Client
    cd client && npm install
    
    # Server
    cd ../server && npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in `server/`:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_atlas_uri
    JWT_SECRET=your_super_secret_key
    BREVO_API_KEY=your_email_api_key
    ```
    Create a `.env` file in `client/`:
    ```env
    REACT_APP_BACKEND_URL=http://localhost:5000
    ```

4.  **Run the App**
    ```bash
    # Runs both Client and Server concurrently
    npm start
    ```

Open `http://localhost:3000` to start coding!

