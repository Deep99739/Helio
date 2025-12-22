# Helio: Real-time Distributed Collaborative Development Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Production_Ready-success.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![React](https://img.shields.io/badge/React-v18-blue.svg)

> **"Build Better, Together."**
>
> A robust, fault-tolerant, and secure collaborative coding environment designed for real-time engineering. Powered by CRDTs for mathematically proven conflict-free editing and an atomic design system.

---
## 💎 Core Functionalities

Helio provides a comprehensive suite of features for seamless collaboration:

### 1. 🚀 Immediate & Anonymous Collaboration
*   **Instant Room Generation**: Users can generate a unique room ID directly from the landing page.
*   **Zero-Friction Access**: Collaborators can join via URL or Room ID instantly as anonymous guests.

### 2. 🔐 User Dashboard & History
*   **Secure Authentication**: Users can sign up/login to access a personalized dashboard.
*   **Room Persistence**: All rooms created by logged-in users are **automatically saved to MongoDB**.
*   **History Access**: Users can revisit any previous coding session; the state is preserved exactly as left.

### 3. 💬 Communication Suite
*   **Real-time Chat**: In-room chat for discussing logic without context switching.
*   **Social Graph**:
    *   **Friend Requests**: Connect with other developers.
    *   **Private Chat**: Direct messaging system for out-of-band communication.

### 4. 🎨 Interactive Whiteboard
*   **Infinite Canvas**: A shared vector-based canvas for architecture diagrams.
*   **Real-time Sync**: Strokes are synchronized instantly using a custom broadcast protocol.
*   **Shape Correction**: Utilizes `perfect-freehand` algorithm for beautifying strokes.

### 5. 💻 Professional Editor
*   **Multi-language Support**: C++, Python, Java, JavaScript, and 10+ others.
*   **Live Presence**: Remote cursors and selection highlights for all active users.
*   **Cloud Compilation**: Execute code remotely via JDoodle API integration.

---

## 🚀 Engineering Highlights

Detailed implementation of **Data Structures, Algorithms, and Design Patterns** to solve complex real-time synchronization challenges.

*   **Conflict-Free Replicated Data Types (CRDTs)**:
    *   Implemented `Yjs` to manage distributed state across clients, ensuring strong eventual consistency without a central authority for conflict resolution.
    *   Solves the "concurrent edit" problem (Split-Brain) using vector clocks and deletion tombstones.
*   **Fault-Tolerant Architecture**:
    *   **Circuit Breaker Pattern**: Custom implementation (`utils/CircuitBreaker.js`) to prevent cascading failures during third-party API outages (e.g., Code Compilation Service).
    *   **Resilient Socket Handling**: Robust logic to handle "Offline-Online" transitions, ensuring no code edits are lost during momentary network drops.
*   **Real-time Event-Driven Communication**:
    *   Built on `Socket.io` (WebSocket) for low-latency, bidirectional events (`JOIN`, `SYNC_CODE`, `ELEMENT-UPDATE`).

*   **Atomic Design System**:
    *   Component-driven UI architecture (`Atomic Design`) using Design Tokens (`tokens.css`) and reusable atoms (`Button`, `Input`, `GlassPane`).


---

## 🏗 System Architecture

### Monolithic Client-Server Architecture
Helio is built as a robust monolith to minimize complexity while maximizing data integrity.

```mermaid
graph TD
    subgraph Client Application
        UI["React UI (Atomic Design)"]
        Yjs["Yjs CRDT Provider"]
        Circuit["Client Logic"]
    end

    subgraph Backend Server
        API["Express REST API"]
        Socket["Socket.io Service"]
        CB["Circuit Breaker Middleware"]
    end

    subgraph Data Layer
        Mongo[("MongoDB Atlas")]
    end

    UI <-->|WebSocket Events| Socket
    Circuit -->|REST Requests| API
    API -->|Mongoose ODM| Mongo
    Socket -->|Persistence| Mongo
    CB --Wraps External Calls--> API
```

### Collaborative Sync Protocol
1.  **Local Mutation**: User types a character; `Yjs` creates a differential update.
2.  **Propagation**: The update is emitted via `socket.io` to the server.
3.  **Broadcast**: Server relays the update to all other clients in the `roomId`.
4.  **Convergence**: Choosing CRDTs ensures that all clients eventually reach the exact same state, regardless of the order of arrival of packets.
5.  **Persistence**: The state is effectively serialized and stored in MongoDB for future retrieval.

---

## 🛠 Tech Stack

### Frontend (Client)
*   **Core**: React 18, JavaScript (ES6+).
*   **State**: Redux Toolkit (Global UI), Yjs (Distributed Doc).
*   **Styling**: Vanilla CSS Variables (Tokens), Glassmorphism.
*   **Editor**: CodeMirror 5 (Custom Bindings).
*   **Whiteboard**: Rough.js, Perfect-Freehand.

### Backend (Server)
*   **Runtime**: Node.js.
*   **Framework**: Express.js.
*   **Real-time**: Socket.io.
*   **Database**: MongoDB (Atlas) + Mongoose.
*   **Resilience**: Custom Circuit Breaker implementation.

---

## 🧩 Algorithms & Data Structures Used

*   **Conflict-Free Replicated Data Types (CRDTs)**:
    *   Uses a **Doubly Linked List** of item structs ($ID_client$, $Clock_{local}$) to manage insertions/deletions.
    *   Guarantees convergence (Commutativity) for concurrent operations.
*   **Circuit Breaker State Machine**:
    *   States: `CLOSED` $\to$ `OPEN` $\to$ `HALF-OPEN`.
    *   Prevents system resource exhaustion during external API failures.
*   **Deboucing**:
    *   Applied to network-heavy operations (like saving to DB) to optimize throughput.

---

## 👨‍💻 Getting Started

1.  **Clone**: `git clone https://github.com/Deep99739/Helio.git`
2.  **Install**: `npm install` (root, client, server)
3.  **Env**: Configure `MONGO_URI`, `PORT`, `JWT_SECRET`.
4.  **Run**: `npm run dev`

---