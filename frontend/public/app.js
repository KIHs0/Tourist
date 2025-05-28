const search = document.querySelector(".btn-search");
const mainSidebar = document.querySelector(".main-sideBar");
const hamburger = document.querySelector(".fa-bars");
const xMarkfrsidebar = document.querySelector(".fa-xmarkfrsidebar");
const faxmarkfruserIcon = document.querySelector(".fa-xmarkfruserIcon");
const mainuserIcon = document.querySelector(".main-userIcon");

search.addEventListener("click", (e) => {
  const searchInput = document.querySelector(".search-input");
  const btnsearchInput = document.querySelector(".btn-search-input");
  searchInput.style.display =
    searchInput.style.display == "none" ? "block" : "none";
  btnsearchInput.style.display =
    btnsearchInput.style.display == "none" ? "block" : "none";
});
hamburger.addEventListener("click", (e) => {
  mainSidebar.style.display =
    mainSidebar.style.display == "none" ? "block" : "none";
  hamburger.style.display =
    hamburger.style.display == "none" ? "block" : "none";
});

xMarkfrsidebar.addEventListener("click", (e) => {
  mainSidebar.style.display =
    mainSidebar.style.display == "none" ? "block" : "none";
  hamburger.style.display =
    hamburger.style.display == "none" ? "block" : "none";
});
faxmarkfruserIcon.addEventListener("click", (e) => {
  mainuserIcon.style.display =
    mainuserIcon.style.display == "none" ? "block" : "none";
});
