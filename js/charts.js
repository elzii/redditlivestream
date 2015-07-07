var CHARTS = (function () {

  var charts = {}


  /**
   * Module Properties
   * 
   */
  charts = {

    config: {
      width: 600,
      height: 600,

      defaults : {
        pie : {
          //Boolean - Whether we should show a stroke on each segment
          segmentShowStroke : true,

          //String - The colour of each segment stroke
          segmentStrokeColor : "#fff",

          //Number - The width of each segment stroke
          segmentStrokeWidth : 2,

          //Number - The percentage of the chart that we cut out of the middle
          percentageInnerCutout : 50, // This is 0 for Pie charts

          //Number - Amount of animation steps
          animationSteps : 100,

          //String - Animation easing effect
          animationEasing : "easeOutBounce",

          //Boolean - Whether we animate the rotation of the Doughnut
          animateRotate : true,

          //Boolean - Whether we animate scaling the Doughnut from the centre
          animateScale : false,

          //String - A legend template
          legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"
        }
      }
    },

    $el: {
      container : $('#charts'),
      canvas : {
        domains : $('#chart--domains'),
        subreddits : $('#chart--subreddits'),
      }
    }
  }


  /**
   * Initialize
   */
  charts.init = function() {
    
    // this.demos()      
  }

  charts.demos = function() {

    var data = ["thecaptainbritainblog.files.wordpress.com","self.leagueoflegends","self.RPGStuck","self.Bitcoin","d3scene.com","imgur.com","self.leagueoflegends","self.worldpowers","self.heroesofthestorm","self.Needafriend","self.DebateReligion","imgur.com","self.heroesofthestorm","viooz.ac","imgur.com","self.techsupport","self.smashbros","imgur.com","i.imgur.com","steamcommunity.com","self.AskScienceFiction","self.GlobalOffensive","self.amiugly","self.cordcutters","pbs.org","dayinthelifeofanatheist.wordpress.com","self.albiononline","self.summonerschool","self.TTRStatus","youtube.com","self.personalfinance","youtube.com","self.leagueoflegends","self.Cplusplus","self.AMA","imgur.com","vimeo.com","self.MensRights","youtube.com","imgur.com","france24.com","self.leagueoflegends","imgur.com","i.imgur.com","steamcommunity.com","self.AskScienceFiction","self.GlobalOffensive","self.amiugly","self.cordcutters","pbs.org","imgur.com","self.GlobalOffensive","self.personalfinance","self.explainlikeimfive","self.DebateaCommunist","self.randomporncomments","primermagazine.com","i.imgur.com","self.explainlikeimfive","self.movies","i.imgur.com","self.thesims","i.imgur.com","self.catfishstories","self.Fireteams","france24.com","self.leagueoflegends","imgur.com","i.imgur.com","steamcommunity.com","self.AskScienceFiction","self.GlobalOffensive","self.amiugly","self.cordcutters","pbs.org"];
    
    var chart = this.domains( data, {
      segmentShowStroke: false,
      animationSteps: 75,
      animationEasing: 'easeInOutQuart'
    })

    // setTimeout(function() {
    //   charts.destroyFancy(chart)
    // }, 1000)

  }


  /**
   * Destroy Chart
   * 
   * @param  {Object} ctx 
   */
  charts.destroy = function(ctx) {
    ctx.destroy()
  }

  /**
   * Destroy Fancy
   * 
   * @param  {Object} ctx - Chart.js object
   * @param  {Number} delay
   */
  charts.destroyFancy = function(ctx, delay) {

    var delay   = delay || 250,
        element = ctx.chart.canvas;

    $(element).fadeOut( delay )

    setTimeout(function() {
      ctx.destroy()
    }, delay)

  }


  /**
   * Domains
   */
  charts.domains = function(domains_arr, options) {

    if ( !domains_arr ) {
      console.log('No array of domains provided');
      return false;
    }

    var options = options || {}

    // Prep canvas
    var ctx = this.$el.canvas.domains.get(0).getContext('2d');

    // Format some data
    var data_formatted = countInstancesOfStringInArray(domains_arr),
        domains_unique = data_formatted[0],
        domains_counts = data_formatted[1],
        data           = [];

    $.each( domains_unique, function (i, domain) {

      // Generate a random color
      var random_color = randomHexColor()

      // Set data object in array
      data[i] = {
       color     : colorLuminance(random_color, -0.25),
       highlight : colorLuminance( random_color, -0.15 ),
       label     : domain,
       value     : domains_counts[i] 
      }

    })

    // Render chart
    return new Chart(ctx).Pie(data, options)
  }


  /**
   * Domains
   */
  charts.subreddits = function(subreddits_arr, options) {

    if ( !subreddits_arr ) {
      console.log('No array of subreddits provided');
      return false;
    }

    var options = options || {}

    // Prep canvas
    var ctx = this.$el.canvas.subreddits.get(0).getContext('2d');

    // Format some data
    var data_formatted    = countInstancesOfStringInArray(subreddits_arr),
        subreddits_unique = data_formatted[0],
        subreddits_count  = data_formatted[1],
        data              = [];

    $.each( subreddits_unique, function (i, subreddit) {

      // Generate a random color
      var random_color = randomHexColor()

      // Set data object in array
      data[i] = {
       color     : colorLuminance(random_color, -0.25),
       highlight : colorLuminance( random_color, -0.15 ),
       label     : subreddit,
       value     : subreddits_count[i] 
      }

    })

    // Render chart
    return new Chart(ctx).Doughnut(data, options)
  }








  /**
   * Private Methods
   * ---------------------
   */
  function rand(min, max) {
    return min + Math.random() * (max - min);
  } 

  /**
   * Random HSL Color
   * @return {[type]} [description]
   */
  function randomHSLColor() {

    var h = rand(1, 360),
        s = rand(0, 100),
        l = rand(0, 100);

    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
  }
  
  /**
   * Generate Random HEX Color
   */
  function randomHexColor() {
    return '#'+(Math.random()*0xFFFFFF<<0).toString(16)
  }

  function colorLuminance(hex, lum) {

    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');

    if ( hex.length < 6 ) {
      hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i*2,2), 16);
      c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
      rgb += ("00"+c).substr(c.length);
    }

    return rgb;
  }

  /**
   * Count the instances of a string in an array
   * 
   * @param  {Array} arr 
   * @return {Array} [a,b]
   */
  function countInstancesOfStringInArray(arr) {
    var a = [], b = [], prev;

    arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
      if ( arr[i] !== prev ) {
        a.push(arr[i]);
        b.push(1);
      } else {
        b[b.length-1]++;
      }
      prev = arr[i];
    }

    return [a, b];
  }  

  /**
   * Format Array of strings by instances
   * 
   * @param  {Array} arr
   * @return {Array} array of objects
   */
  function formatArrayOfStringsWithInstances(arr) {
    var a = [], 
        b = [], 
        prev;

    arr.sort();

    for ( var i = 0; i < arr.length; i++ ) {
      if ( arr[i] !== prev ) {
        a.push(arr[i]);
        b.push(1);
      } else {
        b[b.length-1]++;
      }
      prev = arr[i];
    }


    var data = [];

    for ( var k = 0; k < arr.length; k++ ) {
      data.push({
        label : a[k],
        value : b[k]
      })
    }

    return data;

  }  







  /**
   * EVENT: Document Ready
   * ---------------------
   */
  document.addEventListener('DOMContentLoaded', function (event) {
    

  })


  
  charts.init()
  
  return charts;
}());