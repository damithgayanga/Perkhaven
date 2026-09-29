const panel=document.getElementById("panel");
const content=document.getElementById("panelContent");
const templates={
  hostel:"hostelTemplate",
  rooms:"roomsTemplate",
  facilities:"facilitiesTemplate",
  safety:"safetyTemplate",
  parents:"parentsTemplate",
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
  content.querySelectorAll(".gallery-thumbs button").forEach((button)=>{
    button.addEventListener("click",()=>{
      image.src=button.dataset.img;
      content.querySelectorAll(".gallery-thumbs button").forEach((item)=>item.classList.remove("active"));
      button.classList.add("active");
    });
  });
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
