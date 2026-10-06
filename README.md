<div align="center">

# 🎬 NetMirror RESTful Scraper API

<img src="https://img.shields.io/badge/status-active-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/maintenance-active-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/tests-passing-brightgreen?style=for-the-badge" />

</div>

---

## 📢 Important Notice

> [!IMPORTANT]
> 1. This project is a **scraper and proxy API** for `net77.cc` (NetMirror). It requires valid cookies configured in the root `cookies.json` to authenticate and fetch stream links.
> 2. The media content provided by the scraper is **not** hosted or owned by the author. All rights belong to their respective owners.
> 3. This repository is strictly for **educational and research purposes** only. Any unauthorized use or monetization of this codebase is not recommended.

---

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#features">Key Features</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#api-endpoints">API Endpoints</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#disclaimer">Disclaimer</a></li>
  </ol>
</details>

---

## About The Project

**NetMirror Scraper API** is a lightweight, high-performance Node.js RESTful API that scrapes and proxies video metadata, categories, search results, and direct playback stream URLs from the `net77.cc` platform using the user's active session cookies.

### Key Features
* **Ad-Free Stream Extraction**: Direct HLS stream resolution (`.m3u8` playlist paths) without passing through ad-heavy frontends.
* **Full Metadata Parsing**: Scrapes rich details including description, genres, cast, seasons, episode lists, and runtimes.
* **Robust Origin Restriction (CORS)**: Advanced security middleware enforcing strict domain validation (returns active `403 Forbidden` response for unauthorized requests, not just CORS headers).
* **Comprehensive Test Suite**: Fully automated verification test script (`test-api.js`) to quickly validate scraper health and API stability.

### Built With
* **Node.js** (v18+)
* **Express** (Web framework)
* **Cheerio** (HTML parsing and DOM scraping)
* **dotenv** (Configuration environment management)

---

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites
* **Cookies file**: Ensure you have a valid `cookies.json` file in the root directory containing authenticated session cookies for `net77.cc`. The configuration helper will parse and load these cookies dynamically.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/basirulakhlakborno/netflixmirror-scraper.git
   cd netflixmirror-scraper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (see [Configuration](#configuration)).

4. **Start the API Server**:
   ```bash
   npm start
   ```

5. **Run Verification Tests**:
   Ensure the server is running on the configured port, then execute:
   ```bash
   npm test
   ```

---

## Configuration

Set up your `.env` file in the root directory with the following environment variables:

```env
PORT=3000

# Specify allowed CORS origins (comma-separated). Set to * to allow all.
ALLOWED_ORIGIN=*
```

---

## API Endpoints

### 1. GET `/api/home`
Scrapes the homepage and lists all category rows along with Netflix Title IDs and posters.
* **Response Preview**:
  ```json
  {
    "success": true,
    "categories": [
      {
        "category": "Award-winning Binge-worthy Suspenseful TV Thrillers",
        "itemsCount": 20,
        "items": [
          {
            "id": "81288983",
            "image": "https://imgcdn.kim/poster/341/81288983.jpg"
          }
        ]
      }
    ]
  }
  ```

### 2. GET `/api/series`
Scrapes the TV Series listing page categories and items.

### 3. GET `/api/movies`
Scrapes the Movies listing page categories and items.

### 4. GET `/api/search`
Queries movies and TV shows matching the search term.
* **Query Params**: `q` (string) - Search query term.
* **Example**: `GET /api/search?q=Diplomat`
* **Response Preview**:
  ```json
  {
    "success": true,
    "data": {
      "head": "Movies & TV",
      "type": 0,
      "searchResult": [
        { "id": "81946513", "t": "The Diplomat" },
        { "id": "81288983", "t": "The Diplomat" }
      ]
    }
  }
  ```

### 5. GET `/api/title/:id`
Fetches comprehensive detailed metadata about a movie/series using its Title ID.

### 6. GET `/api/playlist/:id`
Extracts direct HLS playback stream paths and subtitle tracks for a specific video or episode ID.
* **Query Params**: `title` (optional string) - Title of the video for referrer verification.
* **Example**: `GET /api/playlist/81772103?title=The%20Diplomat`

### 7. GET `/api/genres`
Aggregates all genre names from the homepage categories and returns a deduplicated list with counts.

### 8. GET `/api/genres/:genre`
Retrieves all items belonging to a specific genre category.

---

## Roadmap

- [x] Parse direct HLS playback stream paths and subtitle tracks.
- [x] Implement homepage and category-wise listing page scrapers.
- [x] Add server-side origin validation and strict `403 Forbidden` response controls.
- [x] Add auto-aggregating genre parser.
- [x] Implement dynamic REST API verification suite.
- [ ] Add playback domain auto-rotation fallback system.
- [ ] Implement local JSON cache middleware to speed up recurrent scraper requests.

---

## License & Disclaimer

This project is licensed under the [MIT License](file:///d:/tmpp/LICENSE).

### Educational Purpose Only  
This repository and its contents were created solely for **educational purposes** and to showcase technical skills in web scraping and API development.  

* The author of this project does **not** promote, condone, or support any illegal activity, including but not limited to piracy or copyright infringement.  
* The project was developed as an example of web application development and should **only** be used in lawful and ethical ways.  

### No Liability (No Responsibility)  
> [!WARNING]
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
> 
> IN NO EVENT SHALL THE AUTHOR (BASIRUL AKHLAK BORNO) BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE, OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
> 
> **ANY ACTIONS OR CONSEQUENCES ARISING FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS CODEBASE ARE SOLELY THE RESPONSIBILITY OF THE END-USER.**

---
**Date:** 15 July 2026  
**Author:** basirulakhlakborno
