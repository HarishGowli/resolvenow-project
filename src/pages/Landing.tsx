import { Link } from 'react-router-dom';
import { Shield, Clock, MessageSquare, BarChart3, CheckCircle, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const features = [
  { icon: Shield, title: 'Secure & Private', desc: 'Enterprise-grade security protects all complaint data and personal information.' },
  { icon: Clock, title: 'Real-Time Tracking', desc: 'Track every complaint with live status updates and instant notifications.' },
  { icon: MessageSquare, title: 'Direct Chat', desc: 'Communicate directly with assigned agents for faster resolution.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Comprehensive analytics help admins monitor and optimize performance.' },
  { icon: CheckCircle, title: 'Smart Assignment', desc: 'Intelligent routing assigns complaints to the best available agent.' },
  { icon: Users, title: 'Role-Based Access', desc: 'Tailored dashboards for users, agents, and administrators.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-accent" />
            <span className="text-xl font-bold">ComplaintHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost">Login</Button></Link>
            <Link to="/register"><Button>Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero min-h-[90vh] flex items-center pt-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-primary-foreground mb-6 leading-tight"
          >
            Resolve Complaints.
            <br />
            Build Trust.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-lg md:text-xl text-primary-foreground/75 max-w-2xl mx-auto mb-10"
          >
            A modern platform that streamlines complaint management from submission
            to resolution — for users, agents, and administrators.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-base px-8 w-full sm:w-auto">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Try Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            Powerful features designed to handle complaints efficiently at every stage.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-all duration-300"
              >
                <f.icon className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Try It Now</h2>
          <p className="text-muted-foreground mb-8">Use these demo credentials to explore all three roles</p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { role: 'User', email: 'user@demo.com', color: 'stat-border-pending' },
              { role: 'Agent', email: 'agent@demo.com', color: 'stat-border-assigned' },
              { role: 'Admin', email: 'admin@demo.com', color: 'stat-border-resolved' },
            ].map(d => (
              <div key={d.role} className={`bg-card p-4 rounded-lg border border-border border-l-4 ${d.color}`}>
                <p className="font-semibold">{d.role}</p>
                <p className="text-xs text-muted-foreground mt-1">{d.email}</p>
                <p className="text-xs text-muted-foreground">password123</p>
              </div>
            ))}
          </div>
          <Link to="/login" className="mt-8 inline-block">
            <Button size="lg">Login Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 ComplaintHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
