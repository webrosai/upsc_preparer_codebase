import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, CreditCard, Star, Target, TrendingUp } from "lucide-react"

interface DashboardContentProps {
  firstName?: string
  lastName?: string
}

export function DashboardContent({ firstName = "User", lastName = "" }: DashboardContentProps) {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName
  
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {fullName}!</h1>
          <p className="text-muted-foreground mt-1">Let's continue your UPSC preparation journey</p>
        </div>
        <Badge variant="secondary" className="px-4 py-2 text-sm">
          <Star className="h-4 w-4 mr-1 fill-secondary text-secondary-foreground" />
          Premium Member
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Streak</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">24 Days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tests Completed</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">156</div>
            <p className="text-xs text-success mt-1">+12 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">78%</div>
            <p className="text-xs text-success mt-1">+5% improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Hours</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">156 hrs</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Goals</CardTitle>
            <CardDescription>Track your daily preparation targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Current Affairs (5/10 articles)</span>
                <span className="text-sm text-muted-foreground">50%</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Practice Questions (15/20)</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Mains Answer Writing (2/3)</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Your premium membership information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Premium Annual Plan</p>
                <p className="text-xs text-muted-foreground">Renews on Dec 15, 2026</p>
              </div>
              <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">AI Queries Used</span>
                <span className="text-sm font-medium text-foreground">245 / 500</span>
              </div>
              <Progress value={49} className="h-2 mb-4" />
              <div className="flex gap-3">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </Button>
                <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest study sessions and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  type: "Test",
                  title: "Polity Mock Test - 12",
                  score: "85%",
                  time: "2 hours ago",
                  color: "text-primary",
                },
                {
                  type: "Evaluation",
                  title: "Mains Answer - Ethics",
                  score: "7.5/10",
                  time: "5 hours ago",
                  color: "text-accent",
                },
                {
                  type: "Study",
                  title: "Current Affairs - January Week 2",
                  score: "Completed",
                  time: "1 day ago",
                  color: "text-success",
                },
                {
                  type: "Quiz",
                  title: "Geography Quick Quiz",
                  score: "18/20",
                  time: "2 days ago",
                  color: "text-secondary",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${activity.color}`}>
                      <span className="text-xs font-semibold">{activity.type.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{activity.score}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Refer Friends & Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Share your referral code and get 1 month free for each friend who joins
              </p>
            </div>
            <div className="flex flex-col gap-2 items-center">
              <div className="bg-background border border-border rounded-lg px-6 py-3">
                <code className="text-lg font-mono font-bold text-primary">RAHUL2026</code>
              </div>
              <Button size="sm" variant="outline">
                Copy Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
