# 0gram – Lightweight Instagram Alternative Front-End

[![Node](https://badgen.net/badge/node/24/green)](https://nodejs.org/)
[![License](https://badgen.net/github/license/NonsensicalOne/0gram)](./LICENSE)
[![Stars](https://badgen.net/github/stars/NonsensicalOne/0gram)](https://github.com/NonsensicalOne/0gram/stargazers)
[![Forks](https://badgen.net/github/forks/NonsensicalOne/0gram)](https://github.com/NonsensicalOne/0gram/forks)

---

## Screenshots

<img src="https://github.com/user-attachments/assets/b82a9fdc-11f5-4568-97f3-1517180d1e67" alt="Homepage" width=700>
<img src="https://github.com/user-attachments/assets/e3c4c3ed-79cd-4b73-9838-c64fc5cbeb93" alt="Profile" width=700>
<img src="https://github.com/user-attachments/assets/be7e8c31-a82e-44cb-b4bb-df61376127f5" alt="Profile image preview" width=700>

---

## 🚀 Features

* Minimalist Instagram UI clone
* Server-side rendered using EJS
* No tracking, no nonsense
* Easy to self-host

---

## 🛠️ Self-Hosting Guide

### 1. Using Node.js directly

```bash
npm install -g pnpm
pnpm install
node .
```

The app will start on [http://localhost:3000](http://localhost:3000)

---

### 2. Using Docker

#### 🔧 Build the image

```bash
docker build -t 0gram .
```

#### ▶️ Run the container

```bash
docker run -it -p 3000:3000 0gram
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 💬 Contributing

Pull requests are welcome! Feel free to open an issue or submit a PR.

---

## 📝 License

This project is licensed under the AGPLv3 License – see the [LICENSE](./LICENSE) file for details.
