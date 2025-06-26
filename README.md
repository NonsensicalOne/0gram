# 0gram – Lightweight Instagram Alternative Front-End

## I gave up from developing the project. Instagram API gives me headaches.

[![Static Badge](https://img.shields.io/badge/made_with-NodeJS-green)](https://nodejs.org/)
[![GitHub Issues](https://img.shields.io/github/issues/NonsensicalOne/0gram)](https://github.com/NonsensicalOne/0gram/issues)
[![Stars](https://badgen.net/github/stars/NonsensicalOne/0gram)](https://github.com/NonsensicalOne/0gram/stargazers)
[![GitHub Issues or Pull Requests](https://img.shields.io/github/issues-pr/NonsensicalOne/0gram)](https://github.com/NonsensicalOne/0gram/pulls)

---

## Screenshots

<img src="https://github.com/user-attachments/assets/b82a9fdc-11f5-4568-97f3-1517180d1e67" alt="Homepage" width=700>
<img src="https://github.com/user-attachments/assets/e3c4c3ed-79cd-4b73-9838-c64fc5cbeb93" alt="Profile" width=700>
<img src="https://github.com/user-attachments/assets/be7e8c31-a82e-44cb-b4bb-df61376127f5" alt="Profile image preview" width=700>

---

## 🚀 Features

- Minimalist Instagram UI clone
- Server-side rendered using EJS
- No tracking, no nonsense
- Easy to self-host

---

## 🛠️ Self-Hosting Guide

### **Part 1: Configuration**

0gram requires active session headers from a dedicated Instagram account to function correctly.

#### **1. Create a Dedicated Instagram Account**

It is crucial that you do not use your personal or primary Instagram account.

- **Account Safety:** To avoid having your main account flagged or banned by Instagram, create a new, separate account exclusively for 0gram.
- **Verification:** The new account must be verified with both an **email address and a phone number**. Instagram may restrict accounts that it detects as bots. You can use online phone verification services for this step if needed.

#### **2. Extract Session Headers**

Once your dedicated account is created and you are logged in via a web browser:

1.  Navigate to any Instagram profile page (e.g., `https://instagram.com/ichisansfw`).
2.  Open your browser's Developer Tools (`Ctrl+Shift+I` on Windows/Linux, `Cmd+Shift+I` on Mac).
3.  Select the **Network** tab.
4.  ![image](https://github.com/user-attachments/assets/9ba626fb-67df-4002-a427-2dcbccb76dfa)
5.  Refresh the page to capture network requests.
6.  In the filter/search bar of the Network tab, search for the text `query`.
7.  ![image](https://github.com/user-attachments/assets/ece36b88-df1c-4a11-bb84-64ce4d6cf88d)
8.  Right-click on the resulting request, navigate to **Copy**, and select **Copy as Node.js fetch**.
9.  ![image](https://github.com/user-attachments/assets/346f73bd-9c2b-493e-807e-a84c087ffa8c)
10. Paste the copied code into a temporary text editor. You will only need the `headers` object from this code block.

#### **3. Create the `.headers.js` File**

1.  In the root directory of the 0gram project, create a new file and name it `.headers.js`.

2.  Copy the `headers` object you extracted and paste it into this file, following the format below.

    ```js
    const headers = {
      // Paste all the header key-value pairs here. For example:
      accept: "text/html,application/xhtml+xml,xml;q=0.9,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.5",
      "sec-fetch-dest": "document",
      // ... and all other headers from the copied data
    };

    module.exports = headers;
    ```

3.  Save the file. Your configuration is now complete.

---

### **Part 2: Installation and Execution**

Choose one of the following methods to install and run the application.

#### **Method A: Using Node.js**

Run the application directly on your machine using Node.js.

```bash
# Install pnpm, a fast and efficient package manager
npm install -g pnpm

# Install project dependencies
pnpm install

# Start the application
node .
```

The application will be available at [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000).

#### **Method B: Using Docker**

Use Docker to run 0gram in an isolated container.

```bash
# 1. Build the Docker image from the Dockerfile
docker build -t 0gram .

# 2. Run the image in a new container
docker run -it -p 3000:3000 0gram
```

The application will be available at [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000).

---

## 💬 Contributing

Pull requests are welcome! Feel free to open an issue or submit a PR.

---

## 📝 License

This project is licensed under the AGPLv3 License – see the [LICENSE](./LICENSE) file for details.
