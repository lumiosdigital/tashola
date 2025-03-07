document.addEventListener("DOMContentLoaded", function () {
    const accountWrapper = document.querySelector(".account-dropdown-wrapper");
    const accountButton = document.querySelector(".account-button");

    accountButton.addEventListener("click", function (event) {
        event.stopPropagation(); // Prevents the event from bubbling
        accountWrapper.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!accountWrapper.contains(event.target)) {
            accountWrapper.classList.remove("active");
        }
    });
});