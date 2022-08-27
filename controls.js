

function initButtons() {
    document.querySelectorAll('.buttons-group').forEach(g => {
        let buttons = g.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', ()=>{
                btn.classList.add('checked');
                Array.from(buttons)
                    .filter(other=>other!==btn)
                    .forEach(other=>other.classList.remove('checked'));
            });            
        })
    });
    document.querySelectorAll('#group-buttons button').forEach(b=>{
        let btnId = b.getAttribute('id');
        let match = /^(.*)-btn$/.exec(btnId);
        if(match) {
            let groupId = match[1];
            if(groupTable[groupId])
                b.onclick = ()=> setCurrentGroup(groupId);
            else 
                b.style.color = "gray";
        }
    })
    let colors = document.getElementById('colors');
    const m = 10;
    for(let i=0;i<m;i++) {
        let color = chroma.hsl(360 * i / m, 1, 0.6);
        let btn = document.createElement('button');
        btn.style.backgroundColor = color.css();
        btn.classList.add('color-btn');
        btn.onpointerdown = () => {
            setCurrentColor(color);
            btn.classList.add('checked');
            Array.from(document.querySelectorAll('.color-btn'))
                .filter(b=>b!==btn)
                .forEach(b=>b.classList.remove('checked'));
        }
        colors.appendChild(btn);
    }
}

