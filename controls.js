let infoPanel;

// P1,Pm,Cm,Pg,P2,Pmm,Cmm,Pmg,Pgg,
// P3,P31m,P3m1,P4,P4g,P4m,P6,P6m

const groupsData = {
    "P1": { exampleCount: 1 },
    "Pm": { exampleCount: 1 },
    "Cm": { exampleCount: 1 },
    "Pg": { exampleCount: 1 },
    "P2": { exampleCount: 2 },
    "Pmm": { exampleCount: 1 },
    "Cmm": { exampleCount: 2 },
    "Pmg": { exampleCount: 2 },
    "Pgg": { exampleCount: 1 },
    "P3": { exampleCount: 2 },
    "P3m1": { exampleCount: 1 },
    "P31m": { exampleCount: 1 },
    "P4": { exampleCount: 1 },
    "P4g": { exampleCount: 3 },
    "P4m": { exampleCount: 2 },
    "P6": { exampleCount: 3 },
    "P6m": { exampleCount: 3 },
};

function createButton(name, parent) {
    let btn = document.createElement('button');
    btn.setAttribute('type','button');
    if(parent) parent.appendChild(btn);
    btn.classList.add('my-btn');
    btn.innerHTML = name;
    return btn;    
}

function createButtonBar(container) {
    let toolbox = document.createElement('div');
    toolbox.classList.add("control-panel");
    toolbox.setAttribute('id','toolbox');
    container.appendChild(toolbox);
    let btn;
    btn = createButton("clear", toolbox);
    btn.onclick = clearOfflineBuffer;
    btn = createButton("download", toolbox);
    btn.onclick = download;
    let span = document.createElement('span');
    span.innerHTML = "|";
    

    const m = 10;
    let colors = chroma.scale('Spectral').colors(m, null);
    for(let i=0;i<m;i++) {
        let color = colors[i]; // chroma.hsl(360 * i / m, 1, 0.6);
        let colorBtn = document.createElement('button');
        colorBtn.classList.add('my-btn','color-btn');
        colorBtn.style.backgroundColor = color;
        colorBtn.onpointerdown = () => {
            setCurrentColor(color);
            colorBtn.classList.add('checked');
            Array.from(document.querySelectorAll('.color-btn'))
                .filter(b=>b!==colorBtn)
                .forEach(b=>b.classList.remove('checked'));
        }
        toolbox.appendChild(colorBtn);
    }
    container.appendChild(span);
}

class GroupControlPanel {
    constructor(container) {
        let panel = document.createElement('div');
        panel.classList.add("control-panel");
        panel.setAttribute('id','info');
        container.appendChild(panel);
    
        let topBar = document.createElement('div');
        topBar.classList.add('header');
        panel.appendChild(topBar);
        topBar.innerHTML = `
        <select id="group-menu"></select>`;
        let groupMenu = this.groupMenu = topBar.querySelector('#group-menu')
        this.populateGroupMenu(groupMenu);
        
        let body = document.createElement('div');
        body.classList.add('body');
        panel.appendChild(body);
        let description = this.description = document.createElement('p');
        // body.appendChild(description);
        description.innerHTML = "sigh";

        let examplesTitle = document.createElement('H2');
        examplesTitle.innerHTML = "Esempi:";
        body.appendChild(examplesTitle);

        let examples = this.examples = document.createElement('div');
        examples.classList.add("examples");
        examples.setAttribute('id','examples');
        body.appendChild(examples);

        const me = this;
        groupMenu.onchange = ()=>{
            console.log(groupMenu.value);
            setCurrentGroup(groupMenu.value);
            me.refresh(groupMenu.value);
        }    
        this.refresh("P1");
    }

    populateGroupMenu(groupMenu) {
        const groupNameList = [
            "P1","Pm","Cm","Pg","P2","Pmm","Cmm","Pmg","Pgg",
            "P3","P31m","P3m1","P4","P4g","P4m","P6","P6m"
        ];
        groupNameList.forEach(groupName => {
            let opt = document.createElement('option');
            opt.innerHTML = groupName;
            opt.value = groupName;
            groupMenu.appendChild(opt);
        });
    }

    refresh(groupName) {
        this.description.innerHTML = "Descrizione del gruppo " + groupName;
        let info = groupsData[groupName];
        if(info && info.exampleCount>0) {
            this.examples.innerHTML = [...Array(info.exampleCount).keys()]
                .map(i=>`<img src="/assets/wallpaper/${groupName.toLowerCase()}_${i+1}.png"/>`)
                .join(" ");
        } else {
            this.examples.innerHTML = "";
        }
        
    }
}




function createControls() {
    let container = document.getElementById('animation-container');
    if(!container)
    {
        console.warn("Missing container");
        return;
    }
    createButtonBar(container);
    infoPanel = new GroupControlPanel(container);
}


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
    /*
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
    */
}


function updateInfoPanel() {

}