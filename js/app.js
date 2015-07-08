var APP = (function () {

  /**
   * Modules
   * @type {Object}
   */
  var app    = {},
      Charts = window.CHARTS;

  /**
   * Module Properies
   */
  app = {
  
    // Config
    config : {
      environment : window.location.href.match(/(localhost)/g) ? 'development' : 'production',
      debug : window.location.href.match(/(localhost|dev)/g) ? true : false,
      debug_plugins : window.location.href.match(/(localhost)/g) ? true : false,
      debug_console: false
    },


    $el : {

      modals : {
        exports : {
          posts : $('#modal--export-posts'),
        }
      },

      timestamps : {
        start : $('#time--start'),
        end : $('#time--end'),
      }

    }

  }


  /** 
   * Application data/vars
   */
  app.data = {
    reddit : {
      json            : {},
      posts           : [],
      domains         : [],
      subreddits      : [],
      subreddits_unique : [],
      domains_unique  : [],
      links           : [],
      links_unique    : [],
      links_duplicate : 0,
      starting_post   : null,
      ending_post     : null,
      post_count      : 0,
      time_start      : null,
      time_end        : null,

      charts : {

      }
    },
    curl     : {
      temp : null
    },
    temp : {
      posts : []
    },
    supports : {}
  };

  // Constants
  var _DATA   = app.data,
      _REDDIT = app.reddit;

  /**
   * App Init
   */
  app.init = function() {

    this.storage.init()
    this.plugins.init()
    this.events.init()

    // Reddit
    this.reddit.init()
  }




  /**
   * Plugins
   */
  app.plugins = {

    init : function() {
      
    }

  }



  /**
   * Events
   */
  app.events = {

    init : function() {
      this.modals()
    },

    modals: function() {

      // All Modals
      $(document).on('click', '*[data-toggle-modal]', function (event) {
        event.preventDefault()

        var $this   = $(this),
            modalID = $this.data('modal-id');

        $(modalID).modal('show')
      })

      // Bind ESC to close modal
      $(document).on('keyup', function (event) {
        event.preventDefault()
        if ( event.which === 27 ) {
          $('.modal.in').modal('hide')
        }
      })
      
      // Data Export
      $(document).on('click', '*[data-export]', function (event) {

        var $this = $(this),
            key   = $this.data('export')
            input = $this.data('export-input-id')

        // Stop stream
        app.reddit.$el.stop.click()

        // Set start/stop time
        app.$el.timestamps.start.html( _DATA.reddit.time_start )
        app.$el.timestamps.end.html( _DATA.reddit.time_end )

        // Get data obj from key
        var data  = app.data.reddit[key]

        // Set HTML to input
        $(input).html( JSON.stringify(data) )

      })
    }


  }



  /**
   * Reddit Feed
   */
  app.reddit = {

    streaming : true,
    interval  : 10000,
    limit     : 25,
    count     : 25,

    urls      : {
      all_new : 'http://www.reddit.com/r/all/new/.json?sort=new'
    },

    $el : {
      container       : $('#reddit-posts'),
      progress        : $('#reddit-update-interval'),
      post_count      : $('#reddit-post-count'),
      domain_count    : $('#reddit-domain-count'),
      subreddit_count : $('#reddit-subreddit-count'),
      loading         : $('#reddit-loading'),
      repost_count    : $('#reddit-repost-count'),
      stop            : $('#reddit-stop-stream')
    },


    /**
     * Init
     * 
     * Initializes functions
     * 
     * @param none
     * @return none
     */
    init : function() {

      var _this = app.reddit;

      // Bind events
      this.events()

      // Get first list of posts
      this.getJSON( _this.urls.all_new, { 
        sort  : 'new',
        limit : _this.limit,
        count : _this.count
      }, function() {

        _this.updateCharts()

      })

      // Set start time
      var now = new Date()
      app.data.reddit.time_start = now;

      // Run stream update interval
      this.updateStream()

    },


    /**
     * Event Bindings
     */
    events : function() {

      var _this = app.reddit;

      _this.$el.stop.unbind('click').click(function (event) {
        _this.stopStream()

        // Set end time
        var now = new Date()
        app.data.reddit.time_end = now;

        app.data.reddit.duration = calculateDateTimeDifference( app.data.reddit.time_start, app.data.reddit.time_end )

      })

    },


    /**
     * Get JSON
     * 
     * Performs AJAX request to url and uses promises to wait for response
     * 
     * @param [string] (url) the url
     * @param [object] (params) parameters
     * @return none
     */
    getJSON : function(url, params, callback) {

      var _this = app.reddit,
          log   = {},
          data  = {};

      // Show loading spinner
      _this.toggleLoading(true)

      var promise = $.ajax({
        url: url,
        type: 'GET',
        // cache: false,
        dataType: 'json',
        data: params,
      })
      
      promise.done(function (response, status) {
        if ( app.config.debug ) console.log( status, response)
      })
      promise.fail(function (response, status) {
        if ( app.config.debug ) console.log( status, response )
      })

      $.when(promise).done(function (xhrobj) {
        
        // if ( app.config.debug ) { console.log('JSON XHR Object: ', xhrobj) }

        app.data.reddit.json          = xhrobj
        app.data.reddit.starting_post = xhrobj.data.after
        app.data.reddit.ending_post   = xhrobj.data.children[0].data.name

        // Add children to global posts array
        for ( var i=0; i < xhrobj.data.children.length; i++ ) {
          app.data.reddit.posts.push( xhrobj.data.children[i] ) 
        }

        _this.setDataLocally(app.data.reddit.json)

        // if ( app.config.debug ) { console.log('Last Post ID: ', xhrobj.data.children[0].data.name) }

        log.last_post_id = xhrobj.data.children[0].data.name;

        // Count posts
        log.posts_total = _this.postCount('.reddit-post')

        // Count unique domains
        log.domains_unique = _this.countDomainUniques()

        // Count subreddits
        log.subreddits = _this.countSubredditUniques()
        

        // Count duplicate links (reposts)
        log.reposts = _this.countDuplicateLinks()

        // Hide loading spinner
        setTimeout(function() {
          app.reddit.toggleLoading(false)
        }, 25)


        // Log console table
        if ( app.config.debug ) console.table( [log] )
        // if ( app.config.debug ) console.table( [app.data.reddit] )

        if ( callback ) callback()
      })

    },

    /**
     * Set Data Locally
     * 
     * Set returned JSON data from api to a local object
     * 
     * @param [object] (json_data) the JSON data returned from getJSON()
     * @return none
     */
    setDataLocally : function(json_data) {

      // app.data.temp.posts = []

      json_data.data.children.map(function (obj, index) {
        app.data.temp.posts[index] = obj.data
      })

      // Render the posts
      this.render(app.data.temp.posts)

    },


    /**
     * Render
     * 
     * Renders the posts onto the page
     * 
     * @param [object] (data) the post data created from json via api
     * @param [object] (options) additional options, mostly formatting
     * @return none
     */
    render : function(data, options) {

      var _this      = app.reddit,
          $container = _this.$el.container;

      options = options || {};

      if ( options.separator ) {
        $container.find('.media:first-child').before('<hr>');
      }

      var last_ids = [];

      $.each(data, function (index, item) {

        if ( $container.find('.reddit-post[data-post-id="'+item.name+'"]').length > 0 ) {
          console.log('Duplicate post ID '+item.name+', skip rendering.')
          return true;
        }

        // Handle irregular thumbnail values
        if ( item.thumbnail === "self" || item.thumbnail === "default" || item.thumbnail === "nsfw" || item.thumbnail == null || !item.thumbnail ) {
          var thumb_url = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZWVlIi8+PHRleHQgdGV4dC1hbmNob3I9Im1pZGRsZSIgeD0iMzIiIHk9IjMyIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEycHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+NjR4NjQ8L3RleHQ+PC9zdmc+';
        } else {
          var thumb_url = item.thumbnail;
        }

        // Handle post self text
        var self_text  = ( !item.selftext || item.selftext == null || item.selftext === '' ) ? '' : item.selftext;

        // Handle NSFW posts
        var nsfw_label = ( item.thumbnail === 'nsfw' ) ? '<span class="label label-danger">NSFW</span>' : '';


        // Generate HTML for post
        $container.prepend(' \
          <div class="media reddit-post"  \
              data-post-id="'+item.name+'" \
              data-post-url="'+item.url+'" \
            > \
            <a class="thumb pull-left" href="'+item.url+'"> \
              <img class="media-object" src="'+thumb_url+'" width="64" height="64"> \
            </a> \
            <div class="media-body"> \
              <h4 class="media-heading">'+item.title+'</h4> \
              <p>'+self_text+'</p> \
              <footer> \
                <span class="label label-info">'+item.subreddit+'</span> \
                <span class="label label-default">'+item.author+'</span> \
                '+nsfw_label+' \
              </footer> \
            </div> \
          </div> \
        ');

      });

    },


    /**
     * Update Stream
     * 
     * Runs various functions for both processing and displaying stream updates
     * 
     * @param none
     * @return none
     */    
    updateStream : function () {

      var _this = app.reddit,
          freq  = this.interval;


      
      // Animate once initially
      _this.displayUpdateInterval( _this.$el.progress )

      // show progress bar
      app.reddit.streaming = setInterval(function() {
        // Render update progress animaton
        _this.displayUpdateInterval( _this.$el.progress);

        // Get more posts via JSON
        _this.getJSON( app.reddit.urls.all_new, { 
          sort   : 'new', 
          before : app.data.reddit.ending_post,
          limit  : _this.limit,
          count  : _this.count
        }, function() {
          _this.updateCharts()
        })
      }, freq )

    

    },



    /**
     * Stop Streams
     * 
     * Clears interval and stops progress bar animation
     */
    stopStream : function() {

      var _this = app.reddit;

      _this.$el.progress
        .stop()
        .animate({'width' : '0%'}, 75, 'linear')

      clearInterval( app.reddit.streaming )

    },

    /**
     * Display Update Interval
     * 
     * Displays and animates the progress bar indicating the stream update interval
     * 
     * @param [string] (selector) the jquery selector
     * @return none
     */
    displayUpdateInterval: function(selector) {

      var duration = this.interval;

      selector.animate({
        'width' : '100%'
      }, duration, 'linear', function (callback) {
        selector.attr('style', 'width:0px;');
      });

    },



    /**
     * Post Count
     * 
     * Calculates the amount of elements in the DOM to generate a post count. Used 
     * with updateStream() to keep a running tally.
     * 
     * @param [string] (element) the jquery selector
     * @return none
     */
    postCount: function(element) {
      
      var _this = app.reddit,
          count = app.data.reddit.post_count;

      // Data to data object
      $(element).each(function (i) {
        count = i + 1;
      })

      app.data.reddit.post_count = count;

      // if ( app.config.debug ) { console.log('Post count: ', count) }

      // Render
      _this.$el.post_count.text( count )

      return count;
    },



    /**
     * Count Unique Domains
     * 
     * Calculate the number of unique domains
     * 
     * @param none
     * @return none
     */
    countDomainUniques: function() {

      var _this           = app.reddit,
          domains         = app.data.reddit.domains,
          domains_unique  = app.data.reddit.domains_unique;

      // Push to data object
      app.data.temp.posts.map(function (obj, index) {
        domains.push(obj.domain);
      })

      // Loop domains and find uniques
      $.each(domains, function (i, el) {
        if ($.inArray(el, domains_unique) === -1) {
          domains_unique.push(el);
        }
      })

      _this.$el.domain_count.text( domains_unique.length )

      // if ( app.config.debug ) console.log( 'Unique domains: ', domains_unique.length )
      
      return domains_unique.length;

    },


    countSubredditUniques: function() {

      var _this              = app.reddit,
          subreddits         = app.data.reddit.subreddits,
          subreddits_unique  = app.data.reddit.subreddits_unique;

      // Push to data object
      app.data.temp.posts.map(function (obj, index) {
        subreddits.push(obj.subreddit);
      })

      // Loop subreddits and find uniques
      $.each(subreddits, function (i, el) {
        if ($.inArray(el, subreddits_unique) === -1) {
          subreddits_unique.push(el);
        }
      })

      _this.$el.subreddit_count.text( subreddits_unique.length )

      return subreddits_unique.length;

    },



    /**
     * Count Reposts
     * 
     * Calculate the number of reposts
     * 
     * @param none
     * @return none
     */
    countDuplicateLinks: function() {

      var _this        = app.reddit,
          links        = app.data.reddit.links,
          links_unique = app.data.reddit.links_unique;

      // Add to data obj
      app.data.temp.posts.map(function (obj, index) {
        links.push(obj.url)
      })

      // Loop and find uniques
      $.each(links, function (i, el) {
        if ($.inArray(el, links_unique) === -1) {
          links_unique.push(el);
        }
      })

      var difference = links.length - links_unique.length;

      // Add to data obj
      app.data.reddit.links_duplicate = difference;

      // Render 
      _this.$el.repost_count.text(difference);

      // if ( app.config.debug ) console.log('Repost count: ', difference)

      return difference;
    },



    /**
     * Toggle Loading
     * 
     * Toggle display of ajax loading gif
     * 
     * @param [boolean] (visible) on/off
     * @return none
     */
    toggleLoading : function(visible) {

      var _this = app.reddit;

      if ( visible == true ) {
        _this.$el.loading.show();
      } else {
        _this.$el.loading.hide();
      }
    },



    updateCharts : function() {

      // If any previous data (use domain as ref, destroy )
      if ( app.data.reddit.charts.domain ) {
        Charts.destroy( app.data.reddit.charts.domain )
        Charts.destroy( app.data.reddit.charts.subreddits )
        Charts.destroy( app.data.reddit.charts.post_types )
        Charts.destroy( app.data.reddit.charts.nsfw )
      }

      // Domains Chart
      app.data.reddit.charts.domain = Charts.domains( app.data.reddit.domains, {
        segmentShowStroke: false,
        animationSteps: 50,
        animationEasing: 'easeInOutQuart'
      } )

      // Subreddits Chart
      app.data.reddit.charts.subreddits = Charts.subreddits( app.data.reddit.subreddits, {
        segmentShowStroke: false,
        animationSteps: 50,
        animationEasing: 'easeInOutQuart'
      } )
      
      // Post Type Chart
      app.data.reddit.charts.post_types = Charts.postTypes( app.data.reddit.posts, {
        segmentShowStroke: false,
        animationSteps: 50,
        animationEasing: 'easeInOutQuart'
      })     

      // NSFW
      app.data.reddit.charts.nsfw = Charts.nsfw( app.data.reddit.posts, {
        segmentShowStroke: false,
        animationSteps: 50,
        animationEasing: 'easeInOutQuart'
      })

    },



    /**
     * Debug
     * 
     * Various debugging / console logs. Use with updateStream() to repeat occurance.
     * 
     * @param none
     * @return none
     */
    debug: function() {

      // Update interval
      // console.log('Update Interval: ', this.interval/1000 + ' seconds');

      // Starting post ID
      // console.log('Starting post ID: ', app.data.reddit.starting_post);

      // Ending post ID
      // console.log('Ending post ID: ', app.data.reddit.ending_post);
    }


  };






  /**
   * Helpers
   */
  app.helpers = {

    getCurrentURL : function() {
      return location.href;
    },

    getFilename : function(url) {

      var href = url || window.location.href;

      var loc       = window.location || location;
      var filename  = loc.pathname.split("/");
          filename  = filename[filename.length-1];

      return filename;

    },

    getPagename : function(url) {

      var href = url || window.location.href;

      var loc       = window.location || location;
      var filename  = loc.pathname.split("/");
          filename  = filename[filename.length-1];

      var matches   = filename.match(/(.*)\.[^.]+$/);

      if ( matches ) {
        matches = matches[1];
      } else {
        matches = 'index';
      }

      return matches;

    },

    getDomain : function(url) {
      var host    = location.host;
      var matches = host.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      var domain  = matches && matches[1];  // domain will be null if no match is found

      return domain;
    },


    isPage : function(name) {

      var pagename = this.getPagename();

      if ( name == pagename ) {
        return true;
      } else {
        return false;
      }

    },

    isPath : function(pathname, index) {

      if ( index === undefined ) { index = 1; }

      var path = window.location.pathname;

          path = path.split('/');

      return path[index];
      
    }

  };




  /**
   * User Data / Cookies
   */
  app.userData = {

    init : function() {
      this.setUserData();
    },

    setUserData : function() {

      // visits
      var visits = $.cookie('visits') || 0;

      $.cookie('visits', parseInt(visits)+1);

    }
  }


  /**
   * CURL
   * Example: app.curl.get({ url : 'https://www.google.com' });
   */
  app.curl = {

    init : function() {

    },

    get : function(data) {
      var promise = $.ajax({
        url: '/lib/curl.php',
        type: 'GET',
        // dataType: 'jsonp',
        data: {
          url : data.url
        }
      })
      .done(function (data) {
        
      })
      .fail(function (data) {
        
      })
      .always(function (data) {
        
      })

      $.when(promise).done(function (xhrobj) {
        
        app.data.curl.temp = xhrobj;

        console.log('SET `app.data.curl.temp` AS ', app.data.curl.temp);

      });
    }
   
  }





  /**
   * Local Storage
   */
  app.storage = {

    init : function() {

      if ( this.checkSupport() ) {
        app.data.supports.localStorage = true;
      } else {
        app.data.supports.localStorage = false;
      }

    },

    checkSupport : function() {
      try {
        return 'localStorage' in window && window['localStorage'] !== null;
      } catch (e) {
        return false;
      }
    },


    set : function(key, value) {

      if ( typeof value === 'object' ) {
        value = JSON.stringify(value);

      }

      localStorage.setItem(key, value);
    },

    get : function(key) {
      var data;

      if ( !this.hasData(key) ) {
        return false;
      }

      data = localStorage[key];

      // if json, try to parse
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }

    },

    getAll : function() {

      var archive = {},
          keys    = Object.keys(localStorage);

      for (var i=0; i < keys.length; i++) {
         archive[ keys[i] ] = localStorage.getItem( keys[i] );
      }

      return archive;
    },

    hasData : function(key) {
      return !!localStorage[key] && !!localStorage[key].length;
    }

  }




  /**
   * Private Methods
   */
  function calculateDateTimeDifference(time_start, time_end) {

    var difference = time_end - time_start;

    var H = Math.floor(difference / 36e5),
        M = Math.floor(difference % 36e5 / 60000),
        S = Math.floor(difference % 60000 / 1000);

    return {
      duration : ( '' + H + ':' + M + ':' + S ),
      hours : H,
      minutes : M,
      seconds : S
    }
  }



  /**
   * DOCUMENT READY
   * -------------------------------------------------------------------
   *
   */
  document.addEventListener('DOMContentLoaded', function (event) {

    app.userData.init()
    
  })


  /**
   * WINDOW LOAD
   * -------------------------------------------------------------------
   *
   */
  window.addEventListener('load', function (event) {

    // if ( app.helpers.isPath('reddit') ) {
    //   app.reddit.init()
    // }

  })

 
    
  app.init()
  
  return app;
}());