const vscode = acquireVsCodeApi();
document.addEventListener('DOMContentLoaded', () => {
    document.getElementsByClassName('btn-copy')
        .addEventListener('click', e => {
            let i = e.getAttribute('data-id');
            vscode.postMessage({
                command: 'copy',
                text: document.getElementById('sampleInput-' + i).textContent,
            });
        });

    document.getElementsByClassName('btn-edit')
        .addEventListener('click', e => {
            let i = e.getAttribute('data-id');
            vscode.postMessage({
                command: 'edit',
                text: document.getElementById('sampleInput-' + i).textContent,
            });
        });
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