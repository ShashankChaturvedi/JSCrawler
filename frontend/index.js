const form = document.querySelector("form");
const result = document.querySelector("#result");
const submitButton = document.querySelector("#countBtn");
const ssBtn = document.querySelector("#ssBtn");
const screenshotsDiv = document.querySelector("#screenshots");
const urlInput = document.querySelector("#url");

//event listener for counting words
submitButton.addEventListener("click", async (event) => {
  submitButton.disabled = true;
  result.innerHTML =
    "Calculating word count across all internal links, this may take a while...";
  event.preventDefault();
  const url = urlInput.value.trim();
  const data = { url: url };
  //   const formData = new FormData(form);
  //   const url = formData.get('url');
  try {
    const response = await fetch("http://localhost:3000/count", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      //   body: JSON.stringify({ url })
    });
    const { count } = await response.json();
    // console.log("count in index==",count);
    result.innerHTML = `Word count: ${count}`;
  } catch (error) {
    // console.log(error);
    result.textContent = "Error getting word count";
  }
  submitButton.disabled = false;
});

//event listener for screenshots
ssBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  ssBtn.disabled = true;
  screenshotsDiv.innerHTML = "Fetching all images, this may take a while...";
  const url = urlInput.value.trim();
  // const { data: pages } = await axios.post("/screenshots", { url });
  const response = await fetch("http://localhost:3000/screenshots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
  const data = await response.json();
  const pages = data.pages;
  if (pages.length === 0) {
    screenshotsDiv.innerHTML = "No internal pages found!";
  } else {
    screenshotsDiv.innerHTML = "";

    pages.forEach(({ url, screenshot }) => {
      const screenshotImage = new Image();
      screenshotImage.src = `data:image/png;base64,${screenshot}`;
      const screenshotLink = document.createElement("a");
      screenshotLink.href = url;
      screenshotLink.target = "_blank";
      screenshotLink.appendChild(screenshotImage);
      screenshotsDiv.appendChild(screenshotLink);
    });
  }

  ssBtn.disabled = false;
});
