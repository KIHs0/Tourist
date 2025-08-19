const search = document.querySelector(".btn-search");
const mainSidebar = document.querySelector(".main-sideBar");
const hamburger = document.querySelector(".fa-bars");
const xMarkfrsidebar = document.querySelector(".fa-xmarkfrsidebar");
const faxmarkfruserIcon = document.querySelector(".fa-xmarkfruserIcon");
const mainuserIcon = document.querySelector(".main-userIcon");
const searchInput = document.querySelector(".search-input");
const btnsearchInput = document.querySelector(".btn-search-input");
const resultsDiv = document.getElementById("resultsfrinput");
// search.addEventListener("click", (e) => {
//   searchInput.style.display =
//     searchInput.style.display == "none" ? "block" : "none";
//   btnsearchInput.style.display =
//     btnsearchInput.style.display == "none" ? "block" : "none";
// });
// hamburger.addEventListener("click", (e) => {
//   mainSidebar.style.display =
//     mainSidebar.style.display == "none" ? "block" : "none";
//   hamburger.style.display =
//     hamburger.style.display == "none" ? "block" : "none";
// });

// xMarkfrsidebar.addEventListener("click", (e) => {
//   mainSidebar.style.display =
//     mainSidebar.style.display == "none" ? "block" : "none";
//   hamburger.style.display =
//     hamburger.style.display == "none" ? "block" : "none";
// });
// faxmarkfruserIcon.addEventListener("click", (e) => {
//   mainuserIcon.style.display =
//     mainuserIcon.style.display == "none" ? "block" : "none";
// });
const containerSelect = document.querySelector(".containerSidebar .select ");
containerSelect.addEventListener("click", (e) => {
  let url = e?.originalTarget?.value;
  window.location.href = url;
});
// containerSelect.addEventListener("change", () => {
//   console.log(containerSelect.value);
//   // const url = containerSelect.value;
//   if (url) {
//     window.location.href = url;
//   }
// });
document.addEventListener("click", () => {
  resultsDiv.style.display = "none";
});
searchInput.addEventListener("keydown", async (e) => {
  resultsDiv.style.display = "block";
  console.log("35");
  const query = e.target.value;
  if (!query) {
    return;
  }
  setTimeout(async () => {
    const res = await fetch(`/search/live?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    rendervideoLive(data);
  }, 3000);
});
const rendervideoLive = (videos) => {
  if (videos.length == 0) {
    resultsDiv.innerHTML = "<h4>No results found</h4>";
    return;
  }
  // Create HTML for each video item
  const html = videos
    .map(
      (video) => `
<a href="/video/${video._id}/show">
      
    <div class="video-item">
    <h3>${video.title}</h3>
    <p>${video.description}</p>
    
    </div>
</a>`
    )

    .join("");
  resultsDiv.innerHTML = html;
};
