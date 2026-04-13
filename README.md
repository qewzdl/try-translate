# Try Translate

A web application for practicing word translation between English and Russian.

The user selects a translation direction, gets a random word, and has to enter the correct translation. The application checks the answer, shows translation options, and keeps track of correct and incorrect answers.

## Install and Setup

### 1. Clone the repository

```bash
git clone https://github.com/qewzdl/try-translate.git
cd try-translate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create .env file

Example:
```bash
PORT=3000
RANDOM_WORD_API_URL=http://localhost:8000
RANDOM_WORD_DIFF_LEVEL=3
LIBRETRANSLATE_URL=http://localhost:5000
```

## Running the application

```bash
node index.js
```