import KeyGroup from "./KeyGroup.js";
import Observer from "./Observer/Observer.js";
import QueryBuilderSGF from "./QueryBuilder/QueryBuilderSGF.js";
import QueryBuilderCFG_Traducao from "./QueryBuilder/QueryBuilderCFG_Traducao.js";

const STATE_VERSION = 1;

(() => {
  var translationKeys, translationsBox, translationResult, observer;
  var searchCounter = 0;

  var groups = [];
  var queryBuilder = new QueryBuilderSGF();

  document.addEventListener("DOMContentLoaded", () =>{
    populateGlobalVars();
    loadState();
  }, false);

  function translationKeyKeyUp(){
    searchCounter++;
    setTimeout(()=>{
      searchCounter--;
      if(searchCounter === 0) return populateForm();
    }, 500);
  }

  function populateGlobalVars(){
    translationKeys = document.getElementById("translationKeys");
    translationKeys.onkeyup = translationKeyKeyUp;

    translationsBox = document.getElementById("translationsBox");
    translationResult = document.getElementById("translationResult");
    translationResult.onfocus = copyToClipboardOnFocus;

    observer = new Observer(this);
    observer.update = onGroupChanges;

    document.getElementsByName("queryType").forEach((r, i) => {
      r.onchange = onCheckQueryBuilder;
      if(i == 0){
        r.click();
      }
    });
  }

  function onCheckQueryBuilder(e){
    switch (e.target.value) {
    case "SGF":
      queryBuilder = new QueryBuilderSGF();
      break;
    case "CFG_Traducao":
      queryBuilder = new QueryBuilderCFG_Traducao();
      break;
    }
    generateResults();
  }

  function copyToClipboardOnFocus(e){
    e.target.select();
    if(document.execCommand("copy")){
      var alert = document.getElementById("copyAlert");
      alert.style.display = "block";
      setTimeout(()=>{
        alert.style.display = "none";
      }, 2000);
    }
  }

  function populateForm(){
    let newGroups = [];
    parseKeys().forEach((key) => {
      let group = groups.find(v => v.key == key);
      if(!group){
        let group = new KeyGroup(key);
        group.subject.addObserver(observer);
        newGroups.push(group);
        return;
      }else{
        newGroups.push(group);
      }
    });

    translationsBox.innerHTML = "";
    groups = newGroups;
    groups.forEach(v => translationsBox.appendChild(v.DOMElement));
    generateResults();
  }

  function parseKeys(){
    return translationKeys.value.split("\n").reduce((acc, v) => {
      if(typeof v === "string" && v.trim() !== ""){
        acc.push(v.trim());
      }
      return acc;
    }, []);
  }

  function onGroupChanges(){
    generateResults();
    saveState();
  }

  function saveState(){
    let strState = JSON.stringify({
      _version: STATE_VERSION,
      state: groups.map(v => KeyGroup.serialize(v)),
      keys: translationKeys.value
    });
    localStorage.setItem("state", strState);
  }

  function loadState(){
    let strState = localStorage.getItem("state");
    if(strState == null) return;

    let state = JSON.parse(strState);
    if(state._version !== STATE_VERSION) return;


    groups = state.state.map(g => KeyGroup.deserialize(g));
    translationKeys.value = state.keys;

    populateForm();
  }

  function generateResults(){
    translationResult.value = queryBuilder.build(groups);
  }
})();
