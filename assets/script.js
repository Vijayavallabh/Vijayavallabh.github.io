document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      const activePane = document.getElementById(tabId);
      if (activePane) {
        activePane.classList.add('active');
      }
    });
  });
});
