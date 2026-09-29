const panel=document.getElementById("panel");
const content=document.getElementById("panelContent");
const templates={
  hostel:"hostelTemplate",
  rooms:"roomsTemplate",
  facilities:"facilitiesTemplate",
  safety:"safetyTemplate",
  parents:"parentsTemplate",
  promise:"promiseTemplate",
  location:"locationTemplate",
  visit:"visitTemplate",
  gallery:"galleryTemplate"
};

function wirePanelButtons(){
  content.querySelectorAll("[data-panel]").forEach((button)=>{
    button.addEventListener("click",()=>openPanel(button.dataset.panel));
  });
}

function wireGallery(){
  const image=document.getElementById("galleryImage");
  if(!image)return;
  const photos=[
    "/assets/gallery-01.webp",
    "/assets/gallery-02.webp",
    "/assets/gallery-03.webp",
    "/assets/gallery-04.webp",
    "/assets/gallery-05.webp",
    "/assets/gallery-06.webp",
    "/assets/gallery-07.webp",
    "/assets/gallery-08.webp",
    "/assets/gallery-09.webp",
    "/assets/gallery-10.webp",
    "/assets/gallery-11.webp"
  ];
  const prev=content.querySelector(".gallery-prev");
  const next=content.querySelector(".gallery-next");
  const position=content.querySelector("#galleryPosition");
  const progress=content.querySelector("#galleryProgress");
  let index=0;
  let touchStartX=0;

  const show=(nextIndex)=>{
    index=(nextIndex+photos.length)%photos.length;
    image.classList.add("gallery-changing");
    window.setTimeout(()=>{
      image.src=photos[index];
      image.alt=`The Perk Haven property photo ${index+1}`;
      if(position)position.textContent=`${index+1} / ${photos.length}`;
      if(progress)progress.style.width=`${((index+1)/photos.length)*100}%`;
      image.classList.remove("gallery-changing");
    },120);
  };

  prev?.addEventListener("click",()=>show(index-1));
  next?.addEventListener("click",()=>show(index+1));
  image.addEventListener("touchstart",(event)=>{touchStartX=event.changedTouches[0]?.screenX||0},{passive:true});
  image.addEventListener("touchend",(event)=>{
    const delta=(event.changedTouches[0]?.screenX||0)-touchStartX;
    if(Math.abs(delta)>45)show(index+(delta<0?1:-1));
  },{passive:true});
  panel.onkeydown=(event)=>{
    if(event.key==="ArrowLeft")show(index-1);
    if(event.key==="ArrowRight")show(index+1);
  };
  show(0);
}

function setActivePanelTab(name){
  panel.querySelectorAll(".panel-nav [data-panel]").forEach((button)=>{
    button.classList.toggle("active",button.dataset.panel===name);
  });
}

function openPanel(name){
  const template=document.getElementById(templates[name]||templates.hostel);
  if(!template)return;
  content.replaceChildren(template.content.cloneNode(true));
  wirePanelButtons();
  wireGallery();
  setActivePanelTab(name);
  if(!panel.open)panel.showModal();
  content.scrollTop=0;
}

document.querySelectorAll("[data-panel]").forEach((button)=>{
  button.addEventListener("click",()=>openPanel(button.dataset.panel));
});

document.querySelector(".close").addEventListener("click",()=>panel.close());
panel.addEventListener("click",(event)=>{if(event.target===panel)panel.close()});

const slides=[...document.querySelectorAll(".experience-slide")];
const dots=[...document.querySelectorAll(".experience-dots i")];
let currentSlide=0;
if(slides.length){
  window.setInterval(()=>{
    slides[currentSlide].classList.remove("active");
    dots[currentSlide]?.classList.remove("active");
    currentSlide=(currentSlide+1)%slides.length;
    slides[currentSlide].classList.add("active");
    dots[currentSlide]?.classList.add("active");
  },5200);
}

panel.querySelectorAll(".panel-nav [data-panel]").forEach((button)=>{
  button.addEventListener("click",()=>openPanel(button.dataset.panel));
});
