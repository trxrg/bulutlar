'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Function to convert HTML to plain text
    const htmlToPlainText = (html) => {
      if (!html) return '';
      
      // Remove HTML tags and decode HTML entities
      return html
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Decode ampersands
        .replace(/&lt;/g, '<') // Decode less than
        .replace(/&gt;/g, '>') // Decode greater than
        .replace(/&quot;/g, '"') // Decode quotes
        .replace(/&#39;/g, "'") // Decode single quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    // Function to calculate read time
    const calculateReadTime = (explanation, text, commentText) => {
      const wordsPerMinute = 150;
      
      let totalText = '';
      if (explanation) totalText += htmlToPlainText(explanation) + ' ';
      if (text) totalText += htmlToPlainText(text) + ' ';
      if (commentText) totalText += htmlToPlainText(commentText) + ' ';
      
      if (!totalText.trim()) return 1;
      
      const wordCount = totalText.trim().split(/\s+/).filter(word => word.length > 0).length;
      const readTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
      
      return Math.max(1, readTimeMinutes);
    };

    try {
      // Get all articles with their comments
      const articles = await queryInterface.sequelize.query(`
        SELECT 
          a.id,
          a.explanation,
          a.text,
          (
            SELECT c.text 
            FROM comments c 
            WHERE c.articleId = a.id 
            ORDER BY c.createdAt ASC 
            LIMIT 1
          ) as firstCommentText
        FROM articles a
        WHERE a.field1 IS NULL OR a.field1 = ''
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log(`Calculating read time for ${articles.length} articles...`);

      // Update each article with calculated read time
      for (const article of articles) {
        const readTime = calculateReadTime(
          article.explanation, 
          article.text, 
          article.firstCommentText
        );

        await queryInterface.sequelize.query(`
          UPDATE articles 
          SET field1 = :readTime 
          WHERE id = :id
        `, {
          replacements: { readTime: readTime.toString(), id: article.id },
          type: Sequelize.QueryTypes.UPDATE
        });

        console.log(`Article ${article.id}: ${readTime} minutes`);
      }

      console.log('Read time population complete!');
    } catch (error) {
      console.error('Error populating read times:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Clear the field1 column for all articles
    await queryInterface.sequelize.query(`
      UPDATE articles SET field1 = NULL
    `, { type: Sequelize.QueryTypes.UPDATE });
  }
};
