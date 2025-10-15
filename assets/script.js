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

  // Crop tool functionality
  const canvas = document.getElementById('canvas');
  const cropCircle = document.querySelector('.crop-circle');
  const resizeHandle = document.querySelector('.resize-handle');

  let isDragging = false;
  let isResizing = false;
  let startX, startY, startLeft, startTop, startWidth, startHeight;

  if (cropCircle) {
    cropCircle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = cropCircle.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    });
  }

  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = cropCircle.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      e.preventDefault();
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (isDragging && cropCircle) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      cropCircle.style.left = (startLeft + dx) + 'px';
      cropCircle.style.top = (startTop + dy) + 'px';
      updateClipPath();
    } else if (isResizing && cropCircle) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newSize = Math.max(50, startWidth + dx); // minimum size 50px
      cropCircle.style.width = newSize + 'px';
      cropCircle.style.height = newSize + 'px';
      updateClipPath();
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
  });

  function updateClipPath() {
    if (!canvas || !cropCircle) return;
    const canvasRect = canvas.getBoundingClientRect();
    const circleRect = cropCircle.getBoundingClientRect();
    const centerXPercent = ((circleRect.left + circleRect.width / 2 - canvasRect.left) / canvasRect.width) * 100;
    const centerYPercent = ((circleRect.top + circleRect.height / 2 - canvasRect.top) / canvasRect.height) * 100;
    const radiusPercent = (circleRect.width / 2 / canvasRect.width) * 100;
    canvas.style.clipPath = `circle(${radiusPercent}% at ${centerXPercent}% ${centerYPercent}%)`;
  }

  // Initial update if elements exist
  if (canvas && cropCircle) {
    updateClipPath();
  }
});
