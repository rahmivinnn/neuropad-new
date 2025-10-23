import { Link } from "wouter";
import PageTransition from "@/components/page-transition";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery } from "@tanstack/react-query";
import { Settings, ArrowLeft, BookOpen, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { HealthArticle } from "@shared/schema";

export default function DashboardArticles() {
  const { data: articles, isLoading, refetch } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health-articles"],
    retry: false,
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-6 pt-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 neuropad-text-primary" />
              <h1 className="text-2xl font-bold neuropad-text-primary">Health Articles</h1>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                className="w-11 h-11 rounded-2xl bg-white shadow-native flex items-center justify-center native-active"
                disabled={isLoading}
                aria-label="Refresh articles"
              >
                <RefreshCw className={`w-5 h-5 neuropad-text-primary ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
              <Link to="/">
                <button className="w-11 h-11 rounded-2xl bg-white shadow-native flex items-center justify-center native-active" aria-label="Back to Home">
                  <ArrowLeft className="w-5 h-5 neuropad-text-primary" />
                </button>
              </Link>
            </div>
          </div>

          {/* Subpage Navigation */}
          <div className="px-6 mb-4">
            <div className="flex gap-2">
              <Link to="/">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Overview</button>
              </Link>
              <Link to="/dashboard/articles">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Articles</button>
              </Link>
            </div>
          </div>

          {/* Articles List */}
          <div className="px-6 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="native-card-elevated p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {(articles || []).map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="native-card-elevated p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <BookOpen className="w-5 h-5 neuropad-text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold neuropad-text-primary mb-1">{article.title}</h3>
                        <p className="text-sm neuropad-text-secondary mb-2 line-clamp-2">{article.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {article.category}
                          </span>
                          <span className="text-xs neuropad-text-secondary">
                            {article.readTime} min read
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {!isLoading && (!articles || articles.length === 0) && (
              <div className="native-card-elevated p-6 text-center">
                <BookOpen className="w-12 h-12 neuropad-text-primary mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">No Articles Available</h3>
                <p className="text-sm neuropad-text-secondary">Check back later for new health articles.</p>
              </div>
            )}
          </div>
        </div>

        <BottomNavigation currentPage="/" />
      </div>
    </PageTransition>
  );
}