const vscode = acquireVsCodeApi();
document.addEventListener('DOMContentLoaded', () => {
    for (let el of document.getElementsByClassName('btn-copy')) {
        el.addEventListener('click', e => {
            let i = e.getAttribute('data-id');
            vscode.postMessage({
                command: 'copy',
                text: document.getElementById('sampleInput-' + i).textContent,
            });
        });
    }
    for (let el of document.getElementsByClassName('btn-edit')) {
        el.addEventListener('click', e => {
                let i = e.getAttribute('data-id');
                vscode.postMessage({
                    command: 'edit',
                    text: document.getElementById('sampleInput-' + i).textContent,
                });
            });
    }
});

window.addEventListener('message', event => {
    console.log(event);
    const msg = event.data;
    switch (msg.type) {
        case 'playAudio':
            let audio = new Audio(msg.src);
            audio.play();
            break;
    }
});