local avro = require('avro_schema')
local log = require('log')

local schema = {
   media = {
      type = "record",
      name = "media_schema",
      fields = {
         {name = "userid", type = "long"},
         {name = "vpath", type = "string"},
         {name = "url", type = "string"}
      }
   }  
}

return {

   USER_ID = 1,
   VIRTUAL_PATH = 2,
   URL = 3,

   url_pref = "https://cloud.somestorage.com/getfile?id=",

   media_model = {},

   start = function(self)
      box.once('init', function()
         log.info('schema initialize')
         local s = box.schema.create_space('media')
         box.schema.sequence.create('media_id')

         box.schema.user.grant('guest', 'read,write,execute', 'universe')
         s:create_index(
            'primary', {
               parts = {self.USER_ID, 'number', self.VIRTUAL_PATH, 'string'}
            }
         )
      end)

      local ok, media = avro.create(schema.media)
      if ok then
         ok, self.media_model = avro.compile(media)
         if not ok then
            error('schema compilation failed')
         end
      else
         error('schema creation failed')
      end

   end,

   stat = function(self)

      return {
         count = box.space.media:count()
      }
 
   end,

   trunc = function(self)

      return {
         count = box.space.media:truncate()
      }
 
   end,

   add = function(self, user_id, media_file)

      --- TODO implement return id into pool
      local imgurl = self.url_pref .. box.sequence.media_id:next()

      box.space.media:insert({user_id, media_file, imgurl})

      return imgurl
     
   end,

   get_media = function(self, user_id, media_path)

      local res = {}

      for _, tuple in box.space.media.index.primary:pairs({user_id, media_path}) do
         local ok, media_file = self.media_model.unflatten(tuple)
         if not ok then
            error('get_media: cannot render result')
         end
         table.insert(res, media_file)
      end

      return res
   end

}
