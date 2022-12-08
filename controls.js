"use strict";
let infoPanel;
if(!window.assetFolder) window.assetFolder = "examples";
// assets/wallpaper

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
    btn = createButton("<i class='fa-regular fa-file'></i>", toolbox);
    btn.title="Cancella il disegno";
    btn.onclick = clearAll; 
    btn = createButton("<i class='fa-solid fa-download'></i>", toolbox);
    btn.title="Download";
    btn.onclick = download;
    btn = createButton("<i class='fa-solid fa-rotate-left'></i>", toolbox);
    btn.title="Undo";
    btn.onclick = ()=>undo();
    btn = createButton("<i class='fa-solid fa-rotate-right'></i>", toolbox);
    btn.title="Redo";
    btn.onclick = ()=>redo();
    
    let span;


    span = document.createElement('span');
    span.classList.add("spc");
    span.innerHTML = "";
    toolbox.appendChild(span);

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
    span = document.createElement('span');
    span.classList.add("spc");
    span.innerHTML = "";
    toolbox.appendChild(span);


    [chroma("black"), chroma("white")].forEach((bgcol,i) => {
        let bgColorBtn;
        bgColorBtn = document.createElement('button');
        bgColorBtn.classList.add('my-btn','bg-color-btn');
        bgColorBtn.style.backgroundColor = bgcol;
        bgColorBtn.onpointerdown = () => {
                setBackgroundColor(bgcol);
                bgColorBtn.classList.add('checked');
                Array.from(document.querySelectorAll('.bg-color-btn'))
                    .filter(b=>b!==bgColorBtn)
                    .forEach(b=>b.classList.remove('checked'));
            }
            toolbox.appendChild(bgColorBtn);
    
    })

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
        description.classList.add('description');
        body.appendChild(description);
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
            {id:"P1",name:"P1 (o)"}, 
            {id:"Pm",name:"Pm (**)"}, 
            {id:"Cm",name:"Cm (*x)"}, 
            {id:"Pg",name:"Pg (xx)"}, 
            {id:"P2",name:"P2 (2222)"}, 
            {id:"Pmm",name:"Pmm (*2222)"}, 
            {id:"Cmm",name:"Cmm (2*22)"}, 
            {id:"Pmg",name:"Pmg (22*)"}, 
            {id:"Pgg",name:"Pgg (22x)"}, 
            {id:"P3",name:"P3 (333)"}, 
            {id:"P31m",name:"P31m (3*3)"}, 
            {id:"P3m1",name:"P3m1 (*333)"}, 
            {id:"P4",name:"P4 (442)"}, 
            {id:"P4g",name:"P4g (4*2)"}, 
            {id:"P4m",name:"P4m (*442)"}, 
            {id:"P6",name:"P6 (632)"}, 
            {id:"P6m",name:"P6m (*632)"}, 
        ];
        groupNameList.forEach(groupInfo => {
            let opt = document.createElement('option');
            opt.innerHTML = groupInfo.name;
            opt.value = groupInfo.id;
            groupMenu.appendChild(opt);            
        });
        let currentGroupName = localStorage["currentGroupName"];
        if(currentGroupName)groupMenu.value = currentGroupName;
    }

    refresh(groupName) {
        // this.description.innerHTML = "Descrizione del gruppo " + groupName;
        let info = groupsData[groupName];
        if(info && info.exampleCount>0) {
            this.examples.innerHTML = [...Array(info.exampleCount).keys()]
                .map(i=>`<img src="${assetFolder}/${groupName.toLowerCase()}_${i+1}.png"/>`)
                .join(" ");
        } else {
            this.examples.innerHTML = "";
        }
        
        this.description.innerHTML = "";
        let group = getGroup(groupName);
        if(group && group.symmetrySymbols) {
            let lastType=null;
            let touched = {}
            group.symmetrySymbols.forEach(s => {
                if(touched[s.name]) return;
                touched[s.name] = true;
                if(lastType != s.type) {
                    if(lastType != null)
                        this.description.appendChild(document.createElement('br'));
                    let span = document.createElement('span');
                    span.innerHTML = s.type;
                    span.classList.add('symmetry-symbol-label');
                    console.log(span);
                    this.description.appendChild(span);
                    lastType = s.type;
                }
                let cbId = s.name + "_cb";
                let cb = document.createElement('input');
                cb.classList.add('sym-checkbox');
                cb.setAttribute('id',cbId);
                cb.setAttribute('type','checkbox');
                cb.setAttribute('sym-name',s.name);
                cb.onclick = symmetrySymbolToggled;
                this.description.appendChild(cb);
            })
        }

    }
}


function symmetrySymbolToggled() {
    //console.log(arguments);
    //console.log(this);
    let L = [];
    document.querySelectorAll('.sym-checkbox').forEach(cb=>{
        if(cb.checked) L.push(cb.getAttribute('sym-name'));
    });
    console.log(L);
    globalSymmetrySymbols.clear();
    let sgh = new SymmetryGroupHelper(sg,globalSymmetrySymbols);
    sgh.addSymbols(L);
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