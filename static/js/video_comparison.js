// Written by Dor Verbin, October 2021
// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/

function playVids(videoId) {
    var videoMerge = document.getElementById(videoId + "Merge");
    var vid = document.getElementById(videoId);

    var position = 0.5;
    var vidWidth = vid.videoWidth/2;
    var vidHeight = vid.videoHeight;

    var mergeContext = videoMerge.getContext("2d");

    
    if (vid.readyState > 3) {
        vid.play();

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.pageX - bcr.x) / bcr.width);
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.touches[0].pageX - bcr.x) / bcr.width);
        }

        videoMerge.addEventListener("mousemove",  trackLocation, false); 
        videoMerge.addEventListener("touchstart", trackLocationTouch, false);
        videoMerge.addEventListener("touchmove",  trackLocationTouch, false);


        function drawLoop() {
            mergeContext.drawImage(vid, 0, 0, vidWidth, vidHeight, 0, 0, vidWidth, vidHeight);
            var colStart = (vidWidth * position).clamp(0.0, vidWidth);
            var colWidth = (vidWidth - (vidWidth * position)).clamp(0.0, vidWidth);
            mergeContext.drawImage(vid, colStart+vidWidth, 0, colWidth, vidHeight, colStart, 0, colWidth, vidHeight);
            requestAnimationFrame(drawLoop);

            
            var arrowLength = 0.09 * vidHeight;
            var arrowheadWidth = 0.025 * vidHeight;
            var arrowheadLength = 0.04 * vidHeight;
            var arrowPosY = vidHeight / 10;
            var arrowWidth = 0.007 * vidHeight;
            var currX = vidWidth * position;

            // Draw circle
            mergeContext.arc(currX, arrowPosY, arrowLength*0.7, 0, Math.PI * 2, false);
            mergeContext.fillStyle = "#FFD79340";
            mergeContext.fill()
            //mergeContext.strokeStyle = "#444444";
            //mergeContext.stroke()
            
            // Draw border
            mergeContext.beginPath();
            mergeContext.moveTo(vidWidth*position, 0);
            mergeContext.lineTo(vidWidth*position, vidHeight);
            mergeContext.closePath()
            mergeContext.strokeStyle = "#AAAAAA";
            mergeContext.lineWidth = 5;            
            mergeContext.stroke();

            // Draw arrow
            mergeContext.beginPath();
            mergeContext.moveTo(currX, arrowPosY - arrowWidth/2);
            
            // Move right until meeting arrow head
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowWidth/2);
            
            // Draw right arrow head
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowheadWidth/2);
            mergeContext.lineTo(currX + arrowLength/2, arrowPosY);
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowheadWidth/2);
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowWidth/2);

            // Go back to the left until meeting left arrow head
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowWidth/2);
            
            // Draw left arrow head
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowheadWidth/2);
            mergeContext.lineTo(currX - arrowLength/2, arrowPosY);
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY  - arrowheadWidth/2);
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY);
            
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY - arrowWidth/2);
            mergeContext.lineTo(currX, arrowPosY - arrowWidth/2);

            mergeContext.closePath();

            mergeContext.fillStyle = "#AAAAAA";
            mergeContext.fill();

            
            
        }
        requestAnimationFrame(drawLoop);
    } 
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};
    
    
function resizeAndPlay(element)
{
  var cv = document.getElementById(element.id + "Merge");
  cv.width = element.videoWidth/2;
  cv.height = element.videoHeight;
  cv.style.display = "block";
  element.play();
  element.style.height = "0px";  // Hide video without stopping it
    
  playVids(element.id);
}

// Two separate video comparison (left vs right)
function playTwoVids(videoId1, videoId2, canvasId) {
    var videoMerge = document.getElementById(canvasId);
    var vid1 = document.getElementById(videoId1);
    var vid2 = document.getElementById(videoId2);

    var position = 0.5;
    var vidWidth = vid1.videoWidth;
    var vidHeight = vid1.videoHeight;
    var mergeContext = videoMerge.getContext("2d");

    function trackLocation(e) {
        var bcr = videoMerge.getBoundingClientRect();
        position = (e.pageX - bcr.x) / bcr.width;
    }
    function trackLocationTouch(e) {
        var bcr = videoMerge.getBoundingClientRect();
        position = (e.touches[0].pageX - bcr.x) / bcr.width;
    }
    videoMerge.addEventListener("mousemove",  trackLocation,      false);
    videoMerge.addEventListener("touchstart", trackLocationTouch, false);
    videoMerge.addEventListener("touchmove",  trackLocationTouch, false);

    var timeUpdateHandler = null;
    var seekedHandler = null;

    function syncVideos() {
        if (vid1.readyState < 2 || vid2.readyState < 2) return;
        if (vid1.seeking || vid2.seeking) return;
        if (vid1.paused && !vid2.paused) vid1.play().catch(function(){});
        else if (!vid1.paused && vid2.paused) vid2.play().catch(function(){});
        if (Math.abs(vid2.currentTime - vid1.currentTime) > 0.2)
            vid1.currentTime = vid2.currentTime;
    }
    timeUpdateHandler = syncVideos;
    seekedHandler = function() {
        if (vid1.readyState > 0 && vid2.readyState > 0)
            vid1.currentTime = vid2.currentTime;
    };

    var lastSyncTime = 0;
    function drawLoop() {
        var now = Date.now();
        if (now - lastSyncTime > 100) { syncVideos(); lastSyncTime = now; }

        if (vid1.paused && !vid2.paused && vid1.readyState > 3) vid1.play().catch(function(){});
        else if (!vid1.paused && vid2.paused && vid2.readyState > 3) vid2.play().catch(function(){});

        var colStart  = (vidWidth * position).clamp(0.0, vidWidth);
        var rightWidth = vidWidth - colStart;
        if (colStart   > 0) mergeContext.drawImage(vid1, 0,        0, colStart,   vidHeight, 0,        0, colStart,   vidHeight);
        if (rightWidth > 0) mergeContext.drawImage(vid2, colStart, 0, rightWidth, vidHeight, colStart, 0, rightWidth, vidHeight);

        mergeContext.beginPath();
        mergeContext.moveTo(vidWidth * position, 0);
        mergeContext.lineTo(vidWidth * position, vidHeight);
        mergeContext.closePath();
        mergeContext.strokeStyle = "#AAAAAA";
        mergeContext.lineWidth = 5;
        mergeContext.stroke();

        var arrowLength = 0.09 * vidHeight, arrowheadWidth = 0.025 * vidHeight,
            arrowheadLength = 0.04 * vidHeight, arrowPosY = vidHeight / 10,
            arrowWidth = 0.007 * vidHeight, currX = vidWidth * position;
        mergeContext.beginPath();
        mergeContext.arc(currX, arrowPosY, arrowLength * 0.7, 0, Math.PI * 2, false);
        mergeContext.fillStyle = "#FFD79340"; mergeContext.fill();
        mergeContext.beginPath();
        mergeContext.moveTo(currX, arrowPosY - arrowWidth / 2);
        mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowWidth/2);
        mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowheadWidth/2);
        mergeContext.lineTo(currX + arrowLength/2, arrowPosY);
        mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowheadWidth/2);
        mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowWidth/2);
        mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowWidth/2);
        mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowheadWidth/2);
        mergeContext.lineTo(currX - arrowLength/2, arrowPosY);
        mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY - arrowheadWidth/2);
        mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY - arrowWidth/2);
        mergeContext.lineTo(currX, arrowPosY - arrowWidth/2);
        mergeContext.closePath();
        mergeContext.fillStyle = "#AAAAAA"; mergeContext.fill();
        requestAnimationFrame(drawLoop);
    }

    function startPlaying() {
        if (timeUpdateHandler) vid2.removeEventListener('timeupdate', timeUpdateHandler);
        if (seekedHandler)     vid2.removeEventListener('seeked',     seekedHandler);
        vid1.currentTime = 0; vid2.currentTime = 0;
        var p1 = vid1.play().catch(function(){});
        var p2 = vid2.play().catch(function(){});
        Promise.all([p1, p2]).finally(function() {
            vid1.currentTime = vid2.currentTime;
            vid2.addEventListener('timeupdate', timeUpdateHandler);
            vid2.addEventListener('seeked',     seekedHandler);
            requestAnimationFrame(drawLoop);
        });
    }

    if (vid1.readyState > 3 && vid2.readyState > 3) {
        startPlaying();
    } else {
        var checkReady = function() {
            if (vid1.readyState > 3 && vid2.readyState > 3) startPlaying();
        };
        vid1.addEventListener('loadeddata', checkReady);
        vid2.addEventListener('loadeddata', checkReady);
    }
}

function resizeAndPlayTwo(id1, id2, canvasId) {
    var cv   = document.getElementById(canvasId);
    var vid1 = document.getElementById(id1);
    var vid2 = document.getElementById(id2);
    var tries = 0;
    function setupCanvas() {
        if (vid1.videoWidth > 0 && vid2.videoWidth > 0) {
            cv.width  = vid1.videoWidth;
            cv.height = vid1.videoHeight;
            var dw = parseFloat(window.getComputedStyle(cv).width);
            if (dw > 0 && dw !== vid1.videoWidth) {
                cv.style.width  = dw + 'px';
                cv.style.height = (dw * vid1.videoHeight / vid1.videoWidth) + 'px';
            }
            vid1.style.height = "0px";
            vid2.style.height = "0px";
            playTwoVids(id1, id2, canvasId);
            return;
        }
        if (++tries <= 30) setTimeout(setupCanvas, 100);
        else { if (!cv.width) cv.width = 640; if (!cv.height) cv.height = 360; playTwoVids(id1, id2, canvasId); }
    }
    ['loadedmetadata','loadeddata','canplay'].forEach(function(ev) {
        vid1.addEventListener(ev, setupCanvas);
        vid2.addEventListener(ev, setupCanvas);
    });
    vid1.load(); vid2.load(); setupCanvas();
}
