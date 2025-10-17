# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio and blog website built with **Jekyll** using the **Beautiful Jekyll** theme (v4.0.1). It's hosted on GitHub Pages and showcases Jan-Eric Gaidusch's professional profile, skills, and blog posts.

**Live Site:** jani.gaidus.ch
**Theme:** Beautiful Jekyll by Dean Attali
**Jekyll Version:** ~> 3.8

## Development Commands

### Local Development
```bash
# Install dependencies (first time setup)
bundle install

# Run local development server
bundle exec jekyll serve

# Build the site
bundle exec jekyll build

# Build and watch for changes
bundle exec jekyll serve --watch
```

### Testing Changes
The site is hosted on GitHub Pages, so pushing to the `master` branch will automatically deploy changes. Test locally before pushing.

## Architecture & Structure

### Core Jekyll Structure
- **`_config.yml`**: Main configuration file containing site metadata, social links, navbar configuration, analytics, and Jekyll settings
- **`_layouts/`**: HTML templates for different page types
  - `base.html`: Root layout with CSS/JS includes
  - `default.html`: Standard page wrapper
  - `home.html`: Homepage layout with cover images
  - `post.html`: Blog post layout with comments and social sharing
  - `page.html`: Generic page layout
  - `minimal.html`: Minimal layout without header/footer
- **`_includes/`**: Reusable HTML components (nav, footer, head, analytics, comments, social sharing)
- **`_posts/`**: Blog posts in markdown format (filename: `YYYY-MM-DD-title.md`)
- **`_data/`**: Data files (currently contains `ui-text.yml` for internationalization)

### Content Pages
- **`index.html`**: Homepage (uses `home` layout)
- **`aboutme.md`**: About page
- **`skills.md`**: Skills showcase with custom CSS skill bars
- **`tags.html`**: Tag index page for blog posts
- **`404.html`**: Custom 404 error page

### Assets
- **`assets/css/`**: Custom stylesheets
  - `main.css`: Primary stylesheet
  - `bootstrap-social.css`: Social media button styles
  - `pygment_highlights.css`: Code syntax highlighting
  - `staticman.css`: Comment system styles
- **`assets/img/`**: Images, avatars, skill icons
- **`assets/js/`**: JavaScript files

### Archive Directory
Contains an older version of the portfolio with:
- Gulp build system (`gulpfile.js`)
- SCSS source files
- Vendor libraries (Font Awesome, Magnific Popup)
- Alternative HTML/CSS implementation

This is kept for reference but not actively used.

## Key Configuration

### Site Metadata (`_config.yml`)
- **Navigation**: Defined in `navbar-links` (About Me, Skills)
- **Social Links**: Configured in `social-network-links` (email, GitHub, LinkedIn, Twitter, etc.)
- **Analytics**: Google Analytics ID is `UA-139255540-1`
- **Permalink Structure**: `/:year-:month-:day-:title/`
- **Pagination**: 5 posts per page

### Theme Customization
The site uses Beautiful Jekyll theme with customizations:
- Custom color scheme defined in `_config.yml` (navbar, footer, links)
- Avatar image: `/assets/img/avatar-icon.png`
- Cover images for homepage with captions

### Comments System
The site is configured to use Staticman for comments:
- Configuration in `staticman.yml`
- Comment data stored in `_data/comments/{slug}/`
- Currently moderation is disabled (`moderation: false`)
- Alternative comment systems (Disqus, Facebook, Utterances) are available but commented out in config

## Content Guidelines

### Creating Blog Posts
1. Create file in `_posts/` with format: `YYYY-MM-DD-title.md`
2. Include YAML front matter:
   ```yaml
   ---
   layout: post
   title: "Your Title"
   subtitle: "Optional subtitle"
   tags: [tag1, tag2]
   ---
   ```
3. Posts automatically get comments and social sharing enabled (see defaults in `_config.yml`)

### Creating Pages
1. Create `.md` file in root directory
2. Use YAML front matter:
   ```yaml
   ---
   layout: page
   title: "Page Title"
   subtitle: "Optional subtitle"
   ---
   ```

### Skills Page
The `skills.md` file contains custom CSS and HTML for visual skill bars. When updating skills:
- Add skill class in `<style>` section with width percentage and color
- Add corresponding HTML in skill container
- Include skill icon image in `/assets/img/skills/`

## Plugins
- `jekyll-paginate`: Pagination for blog posts
- `jekyll-sitemap`: Automatic sitemap generation

## Important Notes
- The site uses Jekyll 3.8 (older version) due to GitHub Pages constraints
- All changes to `master` branch automatically deploy to GitHub Pages
- Google Analytics tracks with ID `UA-139255540-1`
- The `docs/` directory is excluded from the production site
- Timezone is set to "America/Vancouver"
