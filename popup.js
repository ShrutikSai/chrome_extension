// Import a function to get the URL of the active tab from a separate file.
import { getActiveTabURL } from "./utils.js";

// Function to add a new bookmark to the list.
const addNewBookmark = (bookmarks, bookmark) => {
  // Create elements for the bookmark title and control buttons.
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  // Set the bookmark title and CSS class for styling.
  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  // Create and set attributes for control buttons (play and delete).
  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  // Set attributes and structure for the new bookmark element.
  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  // Append the bookmark title and control buttons to the bookmark element.
  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);

  // Add the new bookmark element to the list of bookmarks.
  bookmarks.appendChild(newBookmarkElement);
};

// Function to display the list of bookmarks.
const viewBookmarks = (currentBookmarks = []) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  // Check if there are bookmarks to display.
  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      // Add each bookmark to the list.
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    // Display a message if there are no bookmarks.
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }
  return;
};

// Function called when the "play" button is clicked.
const onPlay = async (e) => {
  // Get the timestamp associated with the clicked bookmark.
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  // Get the URL of the active tab in the browser.
  const activeTab = await getActiveTabURL();
  // Send a message to the active tab to play the video at the bookmarked time.
  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
  });
};

// Function called when the "delete" button is clicked.
const onDelete = async (e) => {
  // Get the URL of the active tab in the browser.
  const activeTab = await getActiveTabURL();
  // Get the timestamp associated with the clicked bookmark.
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  // Find and remove the bookmark element from the DOM.
  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime
  );
  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);
  // Send a message to the active tab to delete the bookmark.
  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
    value: bookmarkTime,
  }, viewBookmarks);
};

// Function to set attributes for control elements (play and delete buttons).
const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
  // Create an image element for the control button.
  const controlElement = document.createElement("img");
  // Set the image source, title, and click event listener.
  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  // Append the control element to the parent container.
  controlParentElement.appendChild(controlElement);
};

// Event listener for when the HTML document is fully loaded.
document.addEventListener("DOMContentLoaded", async () => {
  // Get the URL of the active tab in the browser.
  const activeTab = await getActiveTabURL();
  // Extract query parameters from the URL.
  const queryParameters = activeTab.url.split("?")[1];
  // Create a URLSearchParams object to work with the parameters.
  const urlParameters = new URLSearchParams(queryParameters);

  // Get the "v" parameter, which represents the video ID.
  const currentVideo = urlParameters.get("v");

  // Check if the active tab is a YouTube video page with a valid video ID.
  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    // Retrieve the bookmarks associated with the current video from Chrome storage.
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];
      // Display the retrieved bookmarks.
      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    // Display a message indicating that it's not a YouTube video page.
    const container = document.getElementsByClassName("container")[0];
    container.innerHTML = '<div class="title">This is not a YouTube video page.</div>';
  }
});
