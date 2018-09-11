
if (typeof jQuery === 'undefined') {
    throw new Error('TNTBenchmark\'s JavaScript requires jQuery')
}

(function( $ ) {

   var TNTBenchmark = function (container, options) {
      this.$container = container;
      this.running = false;

      this.init();
      this.setOptions(options);

      return this; 
   }

   TNTBenchmark.prototype.init = function () {

      this.$container.html('');

      this.$statContainer = $('<div>')
         .appendTo(this.$container);

      $('<div>')
         .appendTo(this.$container)
         .text("see console for results");

      this.$runWriteBtn = $("<button>", {
      }).appendTo(this.$container);
      this.$runWriteBtn
         .text('run write')
         .click((function () {
            this.run(/*read*/ false);
         }).bind(this));

      this.$runReadBtn = $("<button>", {
      }).appendTo(this.$container);
      this.$runReadBtn
         .text('run read')
         .click((function () {
            this.run(/*read*/ true);
         }).bind(this));

      this.$truncBtn = $("<button>", {
      }).appendTo(this.$container);
      this.$truncBtn
         .text('delete all')
         .click((function () {
            this.trunc();
         }).bind(this));

      this.updateStat();
   }

   TNTBenchmark.prototype.setOptions = function (options) {
   }

   TNTBenchmark.prototype.request = function (method, params, onSuccess, onError)
   {
      $.ajax({
         url: "/api",
         type: 'POST',
         data: JSON.stringify({
            "method": method,
            "params": params,
            "id": 0
         }),
         dataType: 'json',
         success: function (data) {
            if ('error' in data) {
               onError(data['error']);
            }
            else {
               onSuccess(data);
            }
         },
         error: function (jqXHR, textStatus) {
            onError(textStatus);
         }
      });
   }

   TNTBenchmark.prototype.updateStat = function ()
   {
      this.request("stat", /*params*/[], (function(data) {
            this.$statContainer.text("records: " + data.result[0].count);
         }).bind(this), (function(err) {
            console.error(err);
         }).bind(this));
   }

   TNTBenchmark.prototype.trunc = function ()
   {
      console.log("trunc space");
      
      this.request("trunc", /*params*/[], (function(data) {
            console.log(data);
            this.$statContainer.text("records: 0");
         }).bind(this), (function(err) {
            console.error(err);
         }).bind(this));
   }

   TNTBenchmark.prototype.run = function (/*read*/ read)
   {
      if (this.running) {
         console.log("still running");
         return;
      }

      console.log("run " + (read ? "read" : "write" ) + " benchmark");

      this.$runReadBtn.prop('disabled', true);
      this.$runWriteBtn.prop('disabled', true);
      this.$truncBtn.prop('disabled', true);

      this.running = true;
      this.pending = 0;
      this.count = 0;
      this.good = 0;
      this.bad = 0;
      this.max = 3000;
      this.users = 5;
      this.start = new Date().getTime();

      var printstat = (function() {

         if (this.count < this.max) {
            return this.pending < 30;
         }
         else if (this.pending < 1) {
            var est = new Date().getTime() - this.start;
            console.log("count=" + this.count + ", good=" + this.good + ", bad=" + this.bad);
            console.log(this.count + " req in " + (est / 1000.0) +
               "s " + (this.count / (est / 1000.0)) + "rq/sec");

            this.$runWriteBtn.prop('disabled', false);
            this.$runReadBtn.prop('disabled', false);
            this.$truncBtn.prop('disabled', false);

            this.running = false;

            this.updateStat();
            return false;
         }

      }).bind(this);   

      var currUser = 1;
      var tester = (function() {
         while (this.count < this.max && this.pending < 50) {

            var mediaPath = "/an/imaginary/folder/pic" + (++this.count) + ".png";
            var userid = currUser++;
            if (currUser > this.users) {
               currUser = 1;
            }

            this.request(read ? "get_media" : "add",
               [userid, mediaPath],
               (function(data) {
                  --this.pending;
                  ++this.good;
                  if (printstat()) {
                     setTimeout(tester, 10);
                  }
               }).bind(this), (function(err) {
                  --this.pending;
                  ++this.bad;
                  if (printstat()) {
                     setTimeout(tester, 10);
                  }
               }).bind(this));
            ++this.pending;
         }

      }).bind(this);
 
      setTimeout(tester, 500);
   }

   function Plugin(options, params) {
      
      if (typeof options == 'string') {

         if (!this.data('tnt_benchmark')) {
            throw new Error('not initialized');
         }

         var data = this.data('tnt_benchmark');

         switch (options) {
         default:
            console.log('unknown method ' + options);
         }

         return;
      }

      return this.each(function() {
         var _this = $(this);
         var data = _this.data('tnt_benchmark');
         if (!data) {
            _this.data('tnt_benchmark', new TNTBenchmark(_this, options));
         }
         else {
            data.setOptions(options);
         }
      });
   }

   $.fn.tntBenchmark = Plugin;

}( jQuery ));
