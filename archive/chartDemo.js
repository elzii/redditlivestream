var canvas = document.getElementById('chart--domain'),
    ctx    = canvas.getContext('2d');

var domains = ["thecaptainbritainblog.files.wordpress.com","self.leagueoflegends","self.RPGStuck","self.Bitcoin","d3scene.com","imgur.com","self.leagueoflegends","self.worldpowers","self.heroesofthestorm","self.Needafriend","self.DebateReligion","imgur.com","self.heroesofthestorm","viooz.ac","imgur.com","self.techsupport","self.smashbros","imgur.com","i.imgur.com","steamcommunity.com","self.AskScienceFiction","self.GlobalOffensive","self.amiugly","self.cordcutters","pbs.org","dayinthelifeofanatheist.wordpress.com","self.albiononline","self.summonerschool","self.TTRStatus","youtube.com","self.personalfinance","youtube.com","self.leagueoflegends","self.Cplusplus","self.AMA","imgur.com","vimeo.com","self.MensRights","youtube.com","imgur.com","france24.com","self.leagueoflegends","imgur.com","i.imgur.com","steamcommunity.com","self.AskScienceFiction","self.GlobalOffensive","self.amiugly","self.cordcutters","pbs.org","imgur.com","self.GlobalOffensive","self.personalfinance","self.explainlikeimfive","self.DebateaCommunist","self.randomporncomments","primermagazine.com","i.imgur.com","self.explainlikeimfive","self.movies","i.imgur.com","self.thesims","i.imgur.com","self.catfishstories","self.Fireteams","france24.com","self.leagueoflegends","imgur.com","i.imgur.com","steamcommunity.com","self.AskScienceFiction","self.GlobalOffensive","self.amiugly","self.cordcutters","pbs.org"],
    arr     = [];

var data_formatted = countInstancesOfStringInArray(domains),
    domains_unique = data_formatted[0],
    domains_counts = data_formatted[1];

$.each( domains_unique, function (i, domain) {

  arr[i] = {}

  var random_color = randomHexColor()

  arr[i].color     = random_color
  arr[i].highlight = colorLuminance( random_color, -0.2 )
  arr[i].label     = domain
  arr[i].value     = domains_counts[i]

})

console.log( arr )


var domain_chart = new Chart(ctx).Pie(arr, {})