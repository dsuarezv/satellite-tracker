import React from 'react';
import GitHubForkRibbon from 'react-github-fork-ribbon';


const Fork = () => {
    return (
        <GitHubForkRibbon href="https://github.com/dsuarezv/satellite-tracker"
                target="_blank"
                position="right">
            Fork me on GitHub
        </GitHubForkRibbon>
    )
}

export default Fork;