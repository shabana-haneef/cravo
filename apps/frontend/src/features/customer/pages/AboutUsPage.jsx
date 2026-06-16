import React from 'react';

export const AboutUsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 font-serif">About Us</h1>
      <div className="prose prose-lg text-gray-600">
        <p className="mb-4">
          Welcome to Cravo Marketplace, your number one source for all local, organic, and homemade products. 
          We're dedicated to giving you the very best of neighborhood goods, with a focus on quality, 
          customer service, and community support.
        </p>
        <p className="mb-4">
          Founded with a passion for helping local sellers thrive, Cravo connects you directly with 
          passionate home-chefs, farmers, and boutique stores in your neighborhood.
        </p>
        <p className="mb-4">
          We hope you enjoy our products as much as we enjoy offering them to you. If you have any questions 
          or comments, please don't hesitate to contact us.
        </p>
      </div>
    </div>
  );
};
