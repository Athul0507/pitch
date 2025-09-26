
# 🚀 App Setup Guide

Hi! This repository contains the **frontend code** and a **skeleton for the app**.

Follow the steps below to get started locally 👇

***

### ⚡ Steps to Start Locally

1. **Clone the repository** and move into the directory:

```bash
git clone <repo-url>
cd <repo-directory>
```

2. **Create a virtual environment**

```bash
python -m venv venv
venv\Scripts\activate   # On Windows
source venv/bin/activate  # On macOS/Linux
```

3. **Install Flask**

```bash
pip install flask
```

4. **Start the server**

```bash
flask --app app run
```


👉 The server will start, and the frontend can be accessed here:
[http://127.0.0.1:5000](http://127.0.0.1:5000)

***

### 🔗 Connecting the Backend

1. **Part names**
    - Currently, we are using a dummy array initialized with the variable **`catalog`**.
    - Replace this with actual data.
2. **Model logic (inside `search_result()`)**
    - The cart part name and threshold will be available as parameters in this function.
    - Set the final dataframe that needs to be displayed in the UI to the **`data_rows`** variable returned by the function.

***

### 🎉 Final Note

Happy Hacking! 🚀👩‍💻👨‍💻

***


