const client_id = "5fc2aa222174ccde3a168ba55367523c"; //this is public and intentional
const jump = 690; //very clean code
const proxy = "https://cors-anywhere-2mlo.onrender.com/"; //currently involves a spin-up, railway is no longer free

var name1, name2;
var select = -1;
animeList = list1 = list2 = [];
choice = "";

var hashParams = window.location.hash.substring(1).split('&'); // substr(1) to remove the `#`
for(var i = 0; i < hashParams.length; i++){
    var p = hashParams[i].split('=');
    if(hashParams != "") document.getElementById(p[0]).value = decodeURIComponent(p[1]);;
} //got this code snippet from stackoverflow to help manage appending info to the url for demo purposes <3
//as is typical with internet snippets it broke the demo so had to add the check for no params

function Anime (id, title, desc, score, image){ //anime info object
    this.id = id;
    this.title = title;
    this.desc = desc;
    this.score = score == undefined ? "N/A" : score.toFixed(2);
    this.image = image.large;
}

function buildCard(anime){ //grabs anime data from object, chucks onto site
    console.log(anime.image);
    console.log(document.getElementById("card").href);
    document.getElementById("card").href = "https://myanimelist.net/" + choice + '/' + anime.id;
    document.getElementById("pic").src = anime.image;
    document.getElementById("desc").innerText = anime.desc;
    document.getElementById("name").innerText = anime.title;
    document.getElementById("score").innerText = anime.score + "⭐";
}

function selectNext(){ //grabs next set of anime data
    if(select == -1) return animeList[++select];
    select = select == animeList.length - 1 ? 0 : ++select;
    console.log(animeList[select]);
    return animeList[select];
} 

function selectLast(){ //idem as above, grab previous data/data from back of list of animes
    select = select == 0 ? animeList.length - 1 : --select;
    console.log(animeList[select]);
    return animeList[select];
} 

async function createList(){ //make list of animes
    select = 0;
    let a = [];  
    const res = await compareUsers(name1, name2);  
    var matches = res;
    if (matches === undefined){
        setText("Error: Invalid User", 'error');
        return;
    }
    if (matches.length == 0) {
        setText("No matches found.", 'text')
        return;
    }
    setText("Matches found. Grabbing data.", 'text')
    for (i = 0; i < matches.length; i++){
        a.push(await convertIDToAnime(matches[i]));
    }
    console.log(a);
    animeList = a;
    remText();
    buildCard(selectNext());
}

document.getElementById("comp").onclick = function(){
    name1 = document.getElementById("user1").value;
    name2 = document.getElementById("user2").value;
    choice = document.getElementById("choice").value;
    setText(name1 + " and " + name2 + " selected.", 'text');
    createList();
}

document.getElementById("next").onclick = function(){
    console.log(select);
    if (select == -1) return;
    buildCard(selectNext());
}

document.getElementById("last").onclick = function(){
    console.log(select);
    if (select == -1) return;
    buildCard(selectLast());
}

document.getElementById("user2").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("comp").click();
    }
  });

function setText(prob, type){ //set error text
    remText();
    let problem = document.createElement("p");
    problem.innerHTML = prob;
    problem.classList.add(type);
    problem.setAttribute('id','text');
    document.getElementById("top").appendChild(problem);
}

function remText(){ //remove problem (error) text
    let textCheck = document.getElementById("text");
    if(textCheck) textCheck.remove();
}

async function convertIDToAnime(animeid){ //take animeid and grab data to make it an object
    link = proxy + 'api.myanimelist.net/v2/' + choice + '/' + animeid + '?fields=title,synopsis,mean,main_picture'; 
    try {
        var response = await fetch(link, {
            method: "GET",
            headers: {
            "X-MAL-CLIENT-ID": client_id,
            }
        });
        var data = await response.json();
        return new Anime(animeid, data.title, data.synopsis, data.mean, data.main_picture);
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}


async function getPTW(user, offset){ //return ptw ids for a user with specific interval (this allows for multiple calls to read whole ptw list)
    link = proxy + 'api.myanimelist.net/v2/users/' + user + '/animelist?offset=' + offset + '&limit=690&nsfw=true&status=plan_to_watch'; 
    if (choice == 'manga') link = proxy + 'api.myanimelist.net/v2/users/' + user + '/mangalist?offset=' + offset + '&limit=690&nsfw=true&status=plan_to_read'; 
    try {
        var response = await fetch(link, {
            method: "GET",
            headers: {
            "X-MAL-CLIENT-ID": client_id,
            }
        });
        var data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

async function getAnimeIDs(user){ //grab list of ids for comparison for a user
    let ids = [];
    let loop = 1;
    let offset = 0;
    while(loop == 1){       
        let json = await getPTW(user, offset);
        console.log(json);
        if(json.error == 'internal_server_error') setText("Internal Server Error", "error");
        for(i = 0; i < json.data.length; i++){
            ids.push(json.data[i].node.id);
        }
        offset += jump;
        if (!json.paging.next) loop = 0;
    }
	return ids;
}


async function compareUsers(user1, user2){ //compare id list for users
    return new Promise((resolve, reject) => {
        var temp = [];
        getAnimeIDs(user1).then(res => {
            var ids1 = res;
            console.log(ids1);
            getAnimeIDs(user2).then(res => {
                var ids2 = res;
                var picked = ids1.length > ids2.length ? ids1 : ids2;
                var unpicked = picked == ids1 ? ids2 : ids1;
                for(j = 0; j < picked.length; j++){
                    if(unpicked.indexOf(picked[j]) != -1) temp.push(picked[j]);
                }
                console.log(temp);
                resolve(temp);
            })
        }) 
    })  
}
