#!/usr/bin/env tarantool

local log = require('log')
local retriever = require('retriever')

box.cfg{
   listen = 3301,
   log_level = 6
}
retriever:start()

function add(user_id, media_file)
   return retriever:add(user_id, media_file)
end

function get_media(user_id, media_path)

   if media_path == nil or user_id == nil or
         type(media_path) ~= "string" or 
         type(user_id) ~= "number" then
      error('invalid args')
      return
   end

   return retriever:get_media(user_id, media_path)

end

function trunc()
   return retriever:trunc()
end

function stat()
   return retriever:stat()
end

