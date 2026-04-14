interface BlogPostSchemaProps {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
}

export default function BlogPostSchema({ title, description, slug, datePublished, dateModified }: BlogPostSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: `https://govcert.ai/blog/${slug}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Organization",
      name: "GovCert",
      url: "https://govcert.ai",
    },
    publisher: {
      "@type": "Organization",
      name: "GovCert",
      url: "https://govcert.ai",
      logo: {
        "@type": "ImageObject",
        url: "https://govcert.ai/opengraph-image.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://govcert.ai/blog/${slug}`,
    },
    isPartOf: {
      "@type": "Blog",
      name: "GovCert Blog",
      url: "https://govcert.ai/blog",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
