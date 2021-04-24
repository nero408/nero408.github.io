---
layout: page
title: Skills
subtitle: My programming skills
cover-img:
- "/assets/img/programming.png"
---

Here is a short summary about programming languages and frameworks I am familiar with!


<style>
/* Make sure that padding behaves as expected */
* {box-sizing:border-box}

/* Container for skill bars */
.skillContainer {
  padding: 30px;
}

/* skill bars */
.skillBar {
  width: 100%; /* Full width */
  padding-right: 0px;
  padding-left: 0px;
  height: 50px;
  margin-bottom:10px;
  display: flex;
  flex-direction: row;
}

.skills {
  height: 30px;
  text-align: right; /* Right-align text */
  padding-right: 0px;
  margin: 0px;
  z-index: 10;
  opacity: 0.6;
  margin-top: 10px; /* Add top padding */
  margin-bottom: 10px; /* Add bottom padding */
  color: white; /* White text color */
  cursor: pointer;
}
.skills:hover {
  opacity: 1;
}

.skillIcon {
  cursor: pointer;
  object-fit: contain;
  margin: 0px;
  z-index: 20;
  margin-left: -25px;
  height: 100%;
}

.skillExplanation {
  padding: 0 18px;
  display: none;
  overflow: hidden;
  background-color: #f1f1f1;
  max-height: 0;
  transition: max-height 0.2s ease-out;
}

.nodejs {width: 90%; background-color: #026e00;} 
.python {width: 60%; background-color: #3776ab;} 
.nestjs {width: 90%; background-color: #ea2845;} 
.docker {width: 80%; background-color: #2496ed;} 
.kubernetes {width: 40%; background-color: #3371e3;} 
</style>
<script>
var coll = document.getElementsByClassName("skillBar");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
}
</script>
<div class="skillContainer">
  <div class="skillBar">
    <div class="skills nodejs"></div>
    <img alt="nodejs" width="50" height="50" class="skillIcon" src="https://github.com/nero408/nero408.github.io/raw/master/assets/img/skills/nodejs.jpg">
  </div>
  <div class="skillExplanation">
  <p>Lorem ipsum...</p>
  </div>

  <div class="skillBar">
    <div class="skills python"></div><img alt="python" width="50" height="50" class="skillIcon" src="https://github.com/nero408/nero408.github.io/raw/master/assets/img/skills/python.png">
  </div>

  <div class="skillBar">
    <div class="skills nestjs"></div><img alt="nestjs" width="50" height="50" class="skillIcon" src="https://github.com/nero408/nero408.github.io/raw/master/assets/img/skills/nestjs.svg">
  </div>

  <div class="skillBar">
    <div class="skills docker"></div><img alt="docker" width="50" height="50" class="skillIcon" src="https://github.com/nero408/nero408.github.io/raw/master/assets/img/skills/docker.png">
  </div>

  <div class="skillBar">
    <div class="skills kubernetes"></div><img alt="kubernetes" width="50" height="50" class="skillIcon" src="https://github.com/nero408/nero408.github.io/raw/master/assets/img/skills/kubernetes.png">
  </div>
</div>



