import React, { useEffect } from 'react';

function Completed() {
    const getTotalUsers = async() => {
        return await fetch('/telegram/poll');
    }

    useEffect(() => {
        getTotalUsers();

        // Load the IFrame API dynamically
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Define the YouTube player instance and create the player
        window.onYouTubeIframeAPIReady = function () {
            new window.YT.Player('player', {
            height: '390',
            width: '640',
            videoId: 'dQw4w9WgXcQ',
            playerVars: {
                'playsinline': 1,
            },
            events: {
                'onReady': onPlayerReady,
            },
            });
        };
    }, []);

    // Function to play the video when the player is ready
    const onPlayerReady = (event) => {
        event.target.playVideo();
    };

    return (
        <div>
            {/* The <div> where the YouTube iframe will be injected */}
            <div id="player"></div>
        </div>
    );
}

export default Completed;
