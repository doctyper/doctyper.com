### 
# Compass
###

# Susy grids in Compass
# First: gem install compass-susy-plugin
# require 'susy'

require "rubygems"
require "chunky_png"
require "base64"

module Sass::Script::Functions
  
  def background_noise(c, noise = 0.5, opacity = 0.08, size = 200, mono = false)
    
    # Convert SASS numbers to Ruby classes
    noise   = noise.to_s.to_f   if noise.is_a? Sass::Script::Number
    opacity = opacity.to_s.to_f if opacity.is_a? Sass::Script::Number
    size    = size.to_i         if size.is_a? Sass::Script::Number
    mono    = mono.to_bool      if mono.is_a? Sass::Script::Bool
    
    # Create the background image
    bg_color = ChunkyPNG::Color.rgba(c.red, c.green, c.blue, (c.alpha * 255).round)
    bg_image = ChunkyPNG::Image.new(size, size, bg_color)
    
    # Create a transparent foreground image
    fg_image = ChunkyPNG::Image.new(size, size)
    
    # Add some noise to the foreground image
    for i in (0..(noise * (size**2)))
      x = rand(size.to_i)
      y = rand(size.to_i)
      r = rand(255)
      a = rand(255 * opacity)
      color = mono ? ChunkyPNG::Color.rgba(r, r, r, a) : ChunkyPNG::Color.rgba(r, rand(255), rand(255), a)
      fg_image.set_pixel(x, y, color)
    end
    
    # Mix it up
    image = bg_image.compose(fg_image)
    
    # Save the image - will eventually save to a file but for now
    # a base64 data url will do...
    data  = Base64.encode64(image.to_blob).gsub("\n", "")
    Sass::Script::String.new("url('data:image/png;base64,#{data}')")
    
  end
  
end

# Change Compass configuration
compass_config do |config|
  config.output_style = :expanded
end

###
# Slim
###

# Slim::Engine.set_default_options :pretty => true

###
# Haml
###

# CodeRay syntax highlighting in Haml
# First: gem install haml-coderay
# require 'haml-coderay'

# CoffeeScript filters in Haml
# First: gem install coffee-filter
# require 'coffee-filter'

# Automatic image dimensions on image_tag helper
# activate :automatic_image_sizes

###
# Page command
###

# Per-page layout changes:
# 
# With no layout
# page "/path/to/file.html", :layout => false
# 
# With alternative layout
# page "/path/to/file.html", :layout => :otherlayout
# 
# A path which all have the same layout
# with_layout :admin do
#   page "/admin/*"
# end

# Proxy (fake) files
# page "/this-page-has-no-template.html", :proxy => "/template-file.html" do
#   @which_fake_page = "Rendering a fake page with a variable"
# end

###
# Helpers
###

# Methods defined in the helpers block are available in templates
# helpers do
#   def some_helper
#     "Helping"
#   end
# end

# Change the CSS directory
set :css_dir, "css"

# Change the JS directory
set :js_dir, "js"

# Change the images directory
set :images_dir, "img"

# Build-specific configuration
configure :build do
  # For example, change the Compass output style for deployment
  activate :minify_css
  
  # Minify Javascript on build
  activate :minify_javascript
  
  # Enable cache buster
  # activate :cache_buster
  
  # Use relative URLs
  # activate :relative_assets
  
  # Compress PNGs after build
  # First: gem install middleman-smusher
  require "middleman-smusher"
  activate :smusher
  
  # Or use a different image path
  # set :http_path, "/Content/images/"

  set :build_dir, "public_html"
end